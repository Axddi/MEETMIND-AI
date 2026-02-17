resource "aws_lambda_function" "fetch" {
  function_name = "meetmind-fetch"
  runtime       = "python3.10"
  handler       = "handler.lambda_handler"
  role          = var.lambda_role_arn
  filename         = "../../backend/lambda/fetch/fetch.zip"
  source_code_hash = filebase64sha256("../../backend/lambda/fetch/fetch.zip")

  environment {
    variables = {
      TABLE_NAME = var.dynamodb_table_name
    }
  }
}
