import json
import boto3
import os
import uuid

s3 = boto3.client("s3")
ddb = boto3.resource("dynamodb")
bedrock = boto3.client("bedrock-runtime")

TABLE_NAME = os.environ["TABLE_NAME"]

def lambda_handler(event, context):
    record = event["Records"][0]
    bucket = record["s3"]["bucket"]["name"]
    key = record["s3"]["object"]["key"]

    meeting_id = key.split("/")[-1].replace(".txt", "")

    obj = s3.get_object(Bucket=bucket, Key=key)
    transcript = obj["Body"].read().decode("utf-8")

    prompt = f"""
    Summarize this meeting.
    Extract:
    - Key decisions
    - Action items
    - Overall sentiment

    Transcript:
    {transcript}
    """

    response = bedrock.invoke_model(
        modelId="anthropic.claude-v2",
        body=json.dumps({
            "prompt": prompt,
            "max_tokens_to_sample": 300,
            "temperature": 0.4
        }),
        contentType="application/json",
        accept="application/json"
    )

    ai_output = json.loads(response["body"].read())

    table = ddb.Table(TABLE_NAME)
    table.put_item(
        Item={
            "meetingId": meeting_id,
            "summary": ai_output,
        }
    )

    return {"statusCode": 200}

