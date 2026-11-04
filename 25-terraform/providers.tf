# Activité 6, étape 119 : provider AWS configuré pour Floci (émulateur AWS local)
terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.region

  # Identifiants lus dans le profil AWS CLI « floci » (test/test, fictifs) :
  # aucun identifiant n'est écrit dans le code Terraform.
  profile = var.aws_profile

  # Floci n'est pas le vrai AWS : pas de vérification des identifiants ni du compte
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  # URL de type http://localhost:4566/bucket : nécessaire avec un endpoint local
  s3_use_path_style = true

  # Tous les services visés pointent vers Floci
  endpoints {
    s3       = var.floci_endpoint
    sqs      = var.floci_endpoint
    dynamodb = var.floci_endpoint
    sts      = var.floci_endpoint
  }

  default_tags {
    tags = {
      projet        = "devsecops-portfolio"
      environnement = var.environnement
      gere_par      = "terraform"
    }
  }
}
