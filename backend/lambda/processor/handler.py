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
    You are an AI meeting assistant.

    Analyze the meeting transcript below and return ONLY valid JSON in this format:

    {{
    "summary": "Concise summary of the meeting",
    "actionItems": ["Action item 1", "Action item 2"],
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
        structured_output = {
            "summary": "Parsing failed",
            "actionItems": [],
            "sentiment": "Unknown"
        }


    from datetime import datetime

    table.put_item(
        Item={
            "meetingId": meeting_id,
            "summary": structured_output.get("summary"),
            "actionItems": structured_output.get("actionItems"),
            "sentiment": structured_output.get("sentiment"),
            "createdAt": datetime.utcnow().isoformat()
        }
    )


    return {"statusCode": 200}

