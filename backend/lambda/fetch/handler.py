import json
import os
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])

def lambda_handler(event, context):
    try:
        print("EVENT:", json.dumps(event))

        meeting_id = event.get("pathParameters", {}).get("meetingId")

        if not meeting_id:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Missing meetingId"})
            }

        response = table.get_item(Key={"meetingId": meeting_id})
        item = response.get("Item")

        if not item:
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Meeting not found"})
            }

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(item)
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }
