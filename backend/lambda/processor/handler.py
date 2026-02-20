import json
import boto3
import os
from datetime import datetime

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
bedrock = boto3.client("bedrock-runtime", region_name="ap-south-1")

TABLE_NAME = os.environ.get("TABLE_NAME", "meetmind-meetings")
BUCKET_NAME = os.environ.get("BUCKET_NAME", "meetmind-ai-transcripts")

table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):
    meeting_id = None

    try:
        record = event["Records"][0]
        key = record["s3"]["object"]["key"]
        meeting_id = key.split("/")[-1].replace(".txt", "")

        print(json.dumps({
            "level": "INFO",
            "message": "Processing started",
            "meetingId": meeting_id
        }))

        obj = s3.get_object(Bucket=BUCKET_NAME, Key=key)
        transcript = obj["Body"].read().decode("utf-8")
        llama_prompt = f"""
        <|begin_of_text|>
        <|start_header_id|>system<|end_header_id|>
        You are a strict JSON API. You only return valid JSON. No explanations. No code.
        <|eot_id|>
        <|start_header_id|>user<|end_header_id|>
        Summarize this meeting transcript and return ONLY valid JSON in this exact format:

        {{
        "summary": "string",
        "actionItems": ["string"],
        "sentiment": "Positive | Neutral | Negative"
        }}

        Transcript:
        {transcript}
        <|eot_id|>
        <|start_header_id|>assistant<|end_header_id|>
        """

        response = bedrock.invoke_model(
            modelId="meta.llama3-8b-instruct-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "prompt": llama_prompt,
                "max_gen_len": 300,
                "temperature": 0.1,
                "top_p": 0.9
            })
        )

        response_body = json.loads(response["body"].read())
        ai_text = response_body.get("generation", "").strip()

        print(json.dumps({
            "level": "INFO",
            "message": "Raw model output",
            "output": ai_text[:300]
        }))

        try:
            structured_output = json.loads(ai_text.strip())
        except Exception:
            structured_output = {
                "summary": ai_text[:300],
                "actionItems": [],
                "sentiment": "Unknown"
            }

        summary = structured_output.get("summary", "")
        action_items = structured_output.get("actionItems", [])
        sentiment = structured_output.get("sentiment", "Unknown")
        table.update_item(
            Key={"meetingId": meeting_id},
            UpdateExpression="""
                SET #s = :status,
                    summary = :summary,
                    actionItems = :actions,
                    sentiment = :sentiment,
                    processedAt = :processedAt
            """,
            ExpressionAttributeNames={
                "#s": "status"
            },
            ExpressionAttributeValues={
                ":status": "COMPLETED",
                ":summary": summary,
                ":actions": action_items,
                ":sentiment": sentiment,
                ":processedAt": datetime.utcnow().isoformat()
            }
        )

        print(json.dumps({
            "level": "INFO",
            "message": "Processing completed",
            "meetingId": meeting_id
        }))

    except Exception as e:
        print(json.dumps({
            "level": "ERROR",
            "message": "Processing failed",
            "error": str(e)
        }))

        if meeting_id:
            try:
                table.update_item(
                    Key={"meetingId": meeting_id},
                    UpdateExpression="SET #s = :status, errorMessage = :err",
                    ExpressionAttributeNames={"#s": "status"},
                    ExpressionAttributeValues={
                        ":status": "FAILED",
                        ":err": str(e)
                    }
                )
            except:
                pass

        raise e
