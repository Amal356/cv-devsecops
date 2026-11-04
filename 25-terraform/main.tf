# Activité 6, étape 121 : ressources du formulaire de contact, créées dans Floci
locals {
  nom = "${var.prefixe}-${var.environnement}"
}

# ---------- S3 : archives des messages de contact
resource "aws_s3_bucket" "contacts" {
  bucket        = "${local.nom}-contacts"
  force_destroy = true # environnement de démonstration : destroy vide le bucket
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
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------- SQS : notifications des nouveaux messages
resource "aws_sqs_queue" "notifications" {
  name                       = "${local.nom}-contact-notifications"
  message_retention_seconds  = 345600 # 4 jours
  visibility_timeout_seconds = 30
  sqs_managed_sse_enabled    = true
}

# ---------- DynamoDB : table des contacts
resource "aws_dynamodb_table" "contacts" {
  name         = "${local.nom}-contacts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }
}
