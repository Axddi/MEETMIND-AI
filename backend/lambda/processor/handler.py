import json
import boto3
import os
from datetime import datetime

s3 = boto3.client("s3")
ddb = boto3.resource("dynamodb")
bedrock = boto3.client("bedrock-runtime")

TABLE_NAME = os.environ["TABLE_NAME"]

def log(level, message, **kwargs):
    print(json.dumps({
        "level": level,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        **kwargs
    }))

def lambda_handler(event, context):
    try:
        record = event["Records"][0]
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

        meeting_id = key.split("/")[-1].replace(".txt", "")

        log("INFO", "Processing started", meetingId=meeting_id)

        table = ddb.Table(TABLE_NAME)

        table.put_item(
            Item={
                "meetingId": meeting_id,
                "status": "PROCESSING",
                "createdAt": datetime.utcnow().isoformat()
            }
        )

        obj = s3.get_object(Bucket=bucket, Key=key)
        transcript = obj["Body"].read().decode("utf-8")

        prompt = f"""
            You are an AI meeting assistant.

            Return ONLY valid JSON in this format:

            {{
            "summary": "Concise summary",
            "actionItems": ["Action 1", "Action 2"],
            "sentiment": "Positive | Neutral | Negative"
            }}

            Transcript:
            {transcript}
            """

        response = bedrock.invoke_model(
            modelId="anthropic.claude-v2",
            body=json.dumps({
                "prompt": prompt,
                "max_tokens_to_sample": 400,
                "temperature": 0.3
            }),
            contentType="application/json",
            accept="application/json"
        )

        result = json.loads(response["body"].read())
        ai_text = result.get("completion", "").strip()

        try:
            structured_output = json.loads(ai_text)
        except json.JSONDecodeError:
            log("ERROR", "JSON parsing failed", meetingId=meeting_id)
            structured_output = {
                "summary": None,
                "actionItems": [],
                "sentiment": "Unknown"
            }

        table.put_item(
            Item={
                "meetingId": meeting_id,
                "status": "COMPLETED",
                "summary": structured_output.get("summary"),
                "actionItems": structured_output.get("actionItems"),
                "sentiment": structured_output.get("sentiment"),
                "createdAt": datetime.utcnow().isoformat(),
                "processedAt": datetime.utcnow().isoformat()
            }
        )

        log("INFO", "Processing completed", meetingId=meeting_id)

        return {"statusCode": 200}

    except Exception as e:
        log("ERROR", "Processing failed", error=str(e))

        if 'meeting_id' in locals():
            table.put_item(
                Item={
                    "meetingId": meeting_id,
                    "status": "FAILED",
                    "errorMessage": str(e),
                    "createdAt": datetime.utcnow().isoformat()
                }
            )

        return {"statusCode": 500}
