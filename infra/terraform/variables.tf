variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "transcript_bucket_name" {
  type    = string
  default = "meetmind-ai-transcripts"
}

variable "dynamodb_table_name" {
  type    = string
  default = "meetmind-meetings"
}
