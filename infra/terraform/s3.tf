resource "aws_s3_bucket" "transcripts" {
  bucket = var.transcript_bucket_name
}
