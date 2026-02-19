resource "aws_lambda_function" "processor" {
  function_name = "meetmind-processor"
  runtime       = "python3.10"
  handler       = "handler.lambda_handler"
  role          = var.lambda_role_arn

  filename         = "${path.root}/../../backend/lambda/processor/processor.zip"
  source_code_hash = filebase64sha256("${path.root}/../../backend/lambda/processor/processor.zip")

  
  timeout      = 15
  memory_size  = 512

  environment {
    variables = {
      TABLE_NAME = var.dynamodb_table_name
    }
  }
}
