import json
import boto3
import os

ddb = boto3.resource("dynamodb")
TABLE_NAME = os.environ["TABLE_NAME"]

def lambda_handler(event, context):
    meeting_id = event.get("pathParameters", {}).get("meetingId")

    if not meeting_id:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "meetingId is required"})
        }

    table = ddb.Table(TABLE_NAME)
    response = table.get_item(Key={"meetingId": meeting_id})
    item = response.get("Item")

    if not item:
        return {
            "statusCode": 404,
            "body": json.dumps({"error": "Meeting not found"})
        }

    status = item.get("status")

    if status == "PROCESSING":
        return {
            "statusCode": 202,
            "body": json.dumps({
                "status": "PROCESSING",
                "message": "Meeting analysis in progress"
            })
        }

    if status == "FAILED":
        return {
            "statusCode": 500,
            "body": json.dumps({
                "status": "FAILED",
                "error": item.get("errorMessage", "Unknown error")
            })
        }

    if status == "COMPLETED":
        return {
            "statusCode": 200,
            "body": json.dumps({
                "status": "COMPLETED",
                "summary": item.get("summary"),
                "actionItems": item.get("actionItems"),
                "sentiment": item.get("sentiment"),
                "createdAt": item.get("createdAt"),
                "processedAt": item.get("processedAt")
            })
        }

    return {
        "statusCode": 500,
        "body": json.dumps({"error": "Invalid state"})
    }
