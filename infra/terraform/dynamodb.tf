resource "aws_dynamodb_table" "meetings" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "meetingId"

  attribute {
    name = "meetingId"
    type = "S"
  }
}
