import json
import os
import sys
import time
from argparse import ArgumentParser
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
PROCESSOR_PATH = ROOT / "backend" / "lambda" / "processor"
sys.path.insert(0, str(PROCESSOR_PATH))


def make_transcript(index):
    topic = [
        "release timing and QA ownership",
        "customer onboarding and support coverage",
        "the quarterly budget and hiring plan",
        "the migration checklist and rollback steps",
        "sales handoff and product feedback",
    ][index % 5]
    intro = f"Meeting {index + 1}: We need to discuss {topic}."
    if index % 3 == 0:
        return (
            intro
            + " Uh, yeah, let's ship Friday. Sam owns the checklist."
            + f" Also, sample-specific note {index + 1}."
        )
    if index % 3 == 1:
        return (
            intro
            + " So, um, the first draft was late, but we can still make Friday."
            + " Priya will send the revised timeline tomorrow, and Lee will"
            + " check the open questions. We should not promise the customer"
            + " until QA confirms the fix. Does that sound right? Yeah, okay."
            + f" Sample-specific note {index + 1}: verify the owner."
        )
    return (
        intro
        + " Okay, quick recap, and sorry, I was talking over you earlier."
        + " The build is mostly ready, but the migration has two unresolved"
        + " risks: the permissions change and the delayed export. We agreed"
        + " that Morgan will test the permissions in staging by Tuesday,"
        + " while Jules will compare the export totals against last week's"
        + " report. If either check fails, we pause the rollout and notify"
        + " support; no one should enable the feature for every customer yet."
        + " Finance asked whether the vendor renewal is included in this"
        + " quarter's budget, and Alex will confirm the amount before the"
        + " planning review. We also need a short customer update, but let's"
        + " keep the date tentative until QA signs off. Um, the overall"
        + " discussion was constructive, although the schedule is tight."
        + f" Sample-specific note {index + 1}: capture the decision and owner."
    )


SAMPLES = [make_transcript(index) for index in range(20)]


class FakeBody:
    def __init__(self, value):
        self.value = value

    def read(self):
        return self.value


class FakeS3:
    def __init__(self):
        self.read_count = 0

    def get_object(self, **_kwargs):
        transcript = SAMPLES[self.read_count]
        self.read_count += 1
        return {"Body": FakeBody(transcript.encode("utf-8"))}


class FakeTable:
    def __init__(self):
        self.updates = []

    def update_item(self, **kwargs):
        self.updates.append(kwargs)
        return {}


class FakeBedrock:
    def __init__(self):
        self.prompts = []
        self.outputs = []

    def invoke_model(self, **kwargs):
        prompt = json.loads(kwargs["body"])["prompt"]
        self.prompts.append(prompt)
        index = len(self.prompts) - 1
        if index == 7:
            generation = "This deliberately malformed mock response is not JSON."
        else:
            generation = json.dumps(
                {
                    "summary": f"Mock summary for sample {index + 1}",
                    "actionItems": [f"Mock action item {index + 1}"],
                    "sentiment": ("Positive", "Neutral", "Negative")[index % 3],
                }
            )
        self.outputs.append(generation)
        return {"body": FakeBody(json.dumps({"generation": generation}).encode())}


def matches_schema(value):
    return (
        isinstance(value, dict)
        and set(value) == {"summary", "actionItems", "sentiment"}
        and isinstance(value.get("summary"), str)
        and isinstance(value.get("actionItems"), list)
        and all(isinstance(item, str) for item in value["actionItems"])
        and value.get("sentiment") in {"Positive", "Neutral", "Negative"}
    )


def print_results(*, mocked, responses):
    lengths = [len(sample.split()) for sample in SAMPLES]
    valid = sum(result["valid"] for result in responses)
    fallbacks = sum(result["fallback"] for result in responses)
    failures = sum(result["status"] != "COMPLETED" for result in responses)
    print(
        json.dumps(
            {
                "bedrock_mocked": mocked,
                "samples_sent": len(SAMPLES),
                "sample_word_counts": {
                    "short": sum(length < 30 for length in lengths),
                    "medium": sum(30 <= length < 70 for length in lengths),
                    "long": sum(length >= 70 for length in lengths),
                },
                "valid_json_matching_schema": valid,
                "valid_percent": valid * 100 / len(SAMPLES),
                "retries": 0,
                "fallbacks": fallbacks,
                "handler_failures": failures,
                "samples": responses,
            },
            indent=2,
        )
    )


def run_mocked():
    import boto3

    s3 = FakeS3()
    table = FakeTable()
    bedrock = FakeBedrock()

    def fake_client(service_name, **_kwargs):
        if service_name == "s3":
            return s3
        if service_name == "bedrock-runtime":
            return bedrock
        raise AssertionError(f"Unexpected AWS client: {service_name}")

    fake_resource = mock.Mock()
    fake_resource.Table.return_value = table

    with (
        mock.patch.dict(
            os.environ,
            {"TABLE_NAME": "benchmark-table", "BUCKET_NAME": "benchmark-bucket"},
        ),
        mock.patch.object(boto3, "client", side_effect=fake_client),
        mock.patch.object(boto3, "resource", return_value=fake_resource),
    ):
        import handler

        failures = 0
        responses = []
        for index in range(len(SAMPLES)):
            event = {
                "Records": [
                    {"s3": {"object": {"key": f"transcripts/sample-{index}.txt"}}}
                ]
            }
            try:
                with redirect_stdout(StringIO()):
                    handler.lambda_handler(event, None)
            except Exception:
                failures += 1
            else:
                output = bedrock.outputs[-1]
                try:
                    valid = matches_schema(json.loads(output))
                except json.JSONDecodeError:
                    valid = False
                update = table.updates[-1]
                responses.append(
                    {
                        "sample": index + 1,
                        "status": "COMPLETED",
                        "valid": valid,
                        "fallback": (
                            update["ExpressionAttributeValues"][":sentiment"]
                            == "Unknown"
                        ),
                    }
                )
            if len(responses) < index + 1:
                responses.append(
                    {
                        "sample": index + 1,
                        "status": "FAILED",
                        "valid": False,
                        "fallback": False,
                    }
                )

    if len(bedrock.prompts) != len(SAMPLES) - failures:
        raise AssertionError("The handler did not invoke mocked Bedrock for each successful sample")
    successful_samples = [
        sample for sample, result in zip(SAMPLES, responses)
        if result["status"] == "COMPLETED"
    ]
    if any(
        transcript not in prompt
        for transcript, prompt in zip(successful_samples, bedrock.prompts)
    ):
        raise AssertionError("A sample transcript was not included in its model prompt")
    print_results(mocked=True, responses=responses)


def request_json(url, method, data=None, content_type=None, timeout=30):
    headers = {}
    if content_type:
        headers["Content-Type"] = content_type
    request = Request(url, data=data, headers=headers, method=method)
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def run_live(api_url, poll_interval, sample_timeout):
    responses = []
    api_url = api_url.rstrip("/")

    for index, transcript in enumerate(SAMPLES):
        started = time.monotonic()
        result = {
            "sample": index + 1,
            "words": len(transcript.split()),
            "status": "FAILED",
            "valid": False,
            "fallback": False,
        }
        try:
            upload = request_json(f"{api_url}/upload", "POST", data=b"")
            meeting_id = upload["meetingId"]
            upload_request = Request(
                upload["uploadUrl"],
                data=transcript.encode("utf-8"),
                headers={"Content-Type": "text/plain"},
                method="PUT",
            )
            with urlopen(upload_request, timeout=30):
                pass

            deadline = time.monotonic() + sample_timeout
            while time.monotonic() < deadline:
                try:
                    meeting = request_json(
                        f"{api_url}/meeting/{meeting_id}", "GET", timeout=20
                    )
                except HTTPError as error:
                    if error.code == 404:
                        time.sleep(poll_interval)
                        continue
                    raise

                status = meeting.get("status")
                if status in {"COMPLETED", "FAILED"}:
                    result["status"] = status
                    if status == "COMPLETED":
                        output = {
                            key: meeting.get(key)
                            for key in ("summary", "actionItems", "sentiment")
                        }
                        result["valid"] = matches_schema(output)
                        result["fallback"] = meeting.get("sentiment") == "Unknown"
                    break
                time.sleep(poll_interval)
            else:
                result["status"] = "TIMEOUT"
        except Exception as error:
            result["error"] = type(error).__name__
            if isinstance(error, HTTPError):
                result["error"] += f" (HTTP {error.code})"

        result["elapsed_seconds"] = round(time.monotonic() - started, 3)
        if "error" not in result and result["status"] == "FAILED":
            result["error"] = "Handler reported FAILED"
        responses.append(result)
        print(
            f"sample {index + 1}/{len(SAMPLES)}: "
            f"{result['status']} valid={result['valid']} "
            f"fallback={result['fallback']} "
            f"elapsed={result['elapsed_seconds']}s",
            flush=True,
        )

    print_results(mocked=False, responses=responses)


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--api-url", default=os.environ.get("MEETMIND_API_URL"))
    parser.add_argument("--poll-interval", type=float, default=2)
    parser.add_argument("--sample-timeout", type=float, default=90)
    args = parser.parse_args()

    if args.live:
        if not args.api_url:
            parser.error("pass --api-url or set MEETMIND_API_URL for live mode")
        run_live(args.api_url, args.poll_interval, args.sample_timeout)
    else:
        run_mocked()
