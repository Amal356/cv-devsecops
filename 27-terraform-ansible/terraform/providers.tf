# Activité 6, étape 134 : Terraform crée l'infrastructure, puis prépare le travail d'Ansible
terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
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
    s3       = "http://localhost:4566"
    sqs      = "http://localhost:4566"
    dynamodb = "http://localhost:4566"
    sts      = "http://localhost:4566"
  }

  default_tags {
    tags = {
      projet   = "devsecops-portfolio"
      gere_par = "terraform"
    }
  }
}
