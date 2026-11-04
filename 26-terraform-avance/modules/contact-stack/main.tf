# Module « contact-stack » : S3 (archives) + SQS (notifications) + DynamoDB (contacts)
# Mêmes ressources que la partie 23, mais paramétrées pour dev, staging et prod.

# ---------- S3 : archives des messages de contact
resource "aws_s3_bucket" "contacts" {
  bucket        = "${var.nom}-contacts"
  force_destroy = var.suppression_forcee
}

resource "aws_s3_bucket_versioning" "contacts" {
  bucket = aws_s3_bucket.contacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "contacts" {
  bucket = aws_s3_bucket.contacts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "contacts" {
  bucket                  = aws_s3_bucket.contacts.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# ---------- SQS : notifications des nouveaux messages
resource "aws_sqs_queue" "notifications" {
  name                       = "${var.nom}-contact-notifications"
  message_retention_seconds  = var.retention_messages_jours * 86400
  visibility_timeout_seconds = 30
  sqs_managed_sse_enabled    = false
}

# ---------- DynamoDB : table des contacts
resource "aws_dynamodb_table" "contacts" {
  name                        = "${var.nom}-contacts"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "id"
  deletion_protection_enabled = var.protection_suppression

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled = false
  }
}
