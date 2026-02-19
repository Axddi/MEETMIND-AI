import json
import boto3
import os
from decimal import Decimal

ddb = boto3.resource("dynamodb")
TABLE_NAME = os.environ["TABLE_NAME"]


def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def lambda_handler(event, context):
    try:
        meeting_id = event.get("pathParameters", {}).get("meetingId")

        if not meeting_id:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": json.dumps({"error": "meetingId is required"})
            }

        table = ddb.Table(TABLE_NAME)
        response = table.get_item(Key={"meetingId": meeting_id})
        item = response.get("Item")

        if not item:
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": json.dumps({"error": "Meeting not found"})
            }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps(item, default=decimal_default)
        }

    except Exception as e:
        print("ERROR:", str(e))
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({"error": str(e)})
        }
