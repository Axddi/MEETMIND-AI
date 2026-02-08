resource "aws_lambda_function" "upload" {
  function_name = "meetmind-upload"
  runtime       = "python3.10"
  handler       = "handler.lambda_handler"
  role          = var.lambda_role_arn

  filename         = "${path.root}/../../backend/lambda/upload/upload.zip"
  source_code_hash = filebase64sha256("${path.root}/../../backend/lambda/upload/upload.zip")

  environment {
    variables = {
      BUCKET_NAME = var.bucket_name
    }
  }
}
