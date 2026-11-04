# Activité 6, étape 127 : bucket S3 qui stockera le state des environnements.
# « Œuf et poule » : ce bucket ne peut pas stocker son propre state, ce petit projet
# garde donc un state local (bootstrap/terraform.tfstate, jamais commité).
terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region                      = "us-east-1"
  profile                     = "floci"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
  endpoints {
    s3  = "http://localhost:4566"
    sts = "http://localhost:4566"
  }
}

resource "aws_s3_bucket" "state" {
  bucket = "devsecops-tfstate"
}

# Versioning : chaque écriture du state garde l'ancienne version (retour arrière possible)
resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Le state peut contenir des valeurs sensibles : chiffrement et accès public bloqué
resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "bucket_state" {
  value = aws_s3_bucket.state.bucket
}
