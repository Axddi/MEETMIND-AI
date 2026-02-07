import json
import boto3
import os
import uuid

s3 = boto3.client("s3")
BUCKET_NAME = os.environ.get("BUCKET_NAME")

def lambda_handler(event, context):
    meeting_id = str(uuid.uuid4())
    file_key = f"transcripts/{meeting_id}.txt"

    presigned_url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": file_key,
            "ContentType": "text/plain"
        },
        ExpiresIn=300
    )

    return {
        "statusCode": 200,
        "body": json.dumps({
            "meetingId": meeting_id,
            "uploadUrl": presigned_url
        })
    }
