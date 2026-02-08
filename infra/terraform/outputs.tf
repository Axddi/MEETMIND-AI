output "api_endpoint" {
  description = "MeetMind AI HTTP API endpoint"
  value       = module.apigw.api_endpoint
}
output "transcript_bucket_name" {
  description = "S3 bucket for meeting transcripts"
  value       = aws_s3_bucket.transcripts.bucket
}
output "dynamodb_table_name" {
  description = "DynamoDB table storing meeting insights"
  value       = aws_dynamodb_table.meetings.name
}
output "upload_lambda_name" {
  description = "Upload Lambda function name"
  value       = "meetmind-upload"
}

output "processor_lambda_name" {
  description = "Processor Lambda function name"
  value       = "meetmind-processor"
}
