output "upload_lambda_arn" {
  value = aws_lambda_function.upload.arn
}

output "processor_lambda_arn" {
  value = aws_lambda_function.processor.arn
}

output "fetch_lambda_arn" {
  value = aws_lambda_function.fetch.arn
}
