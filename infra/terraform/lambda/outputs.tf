output "upload_lambda_arn" {
  value = aws_lambda_function.upload.arn
}

output "upload_lambda_invoke_arn" {
  value = aws_lambda_function.upload.invoke_arn
}

output "fetch_lambda_arn" {
  value = aws_lambda_function.fetch.arn
}

output "fetch_lambda_invoke_arn" {
  value = aws_lambda_function.fetch.invoke_arn
}
