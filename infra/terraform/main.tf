provider "aws" {
  region = var.aws_region
}


module "iam" {
  source = "./iam"
}

module "lambda" {
  source              = "./lambda"
  lambda_role_arn     = module.iam.lambda_role_arn
  bucket_name         = aws_s3_bucket.transcripts.bucket
  dynamodb_table_name = aws_dynamodb_table.meetings.name
}
module "apigw" {
  source            = "./apigw"
  upload_lambda_arn = module.lambda.upload_lambda_arn
}

