# Activité 6, étape 132 : configuration COMMUNE à dev, staging et prod (Terragrunt)
# Le provider et le backend ne sont plus copiés trois fois : Terragrunt les génère
# dans chaque environnement à partir de ce fichier unique.

locals {
  floci = "http://localhost:4566"
  env   = basename(get_terragrunt_dir()) # dev, staging ou prod (nom du dossier)
}

# Terragrunt utilise OpenTofu s'il est installé : on impose Terraform pour comparer à l'identique
terraform_binary = "terraform"

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOT
provider "aws" {
  region                      = "us-east-1"
  profile                     = "floci"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
  endpoints {
    s3       = "${local.floci}"
    sqs      = "${local.floci}"
    dynamodb = "${local.floci}"
    sts      = "${local.floci}"
  }
  default_tags {
    tags = {
      projet        = "devsecops-portfolio"
      environnement = "${local.env}"
      gere_par      = "terragrunt"
    }
  }
}
EOT
}

generate "backend" {
  path      = "backend.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOT
terraform {
  backend "s3" {
    bucket                      = "devsecops-tfstate"
    key                         = "terragrunt/${path_relative_to_include()}/terraform.tfstate"
    region                      = "us-east-1"
    use_lockfile                = true
    encrypt                     = true
    profile                     = "floci"
    use_path_style              = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    endpoints = {
      s3  = "${local.floci}"
      sts = "${local.floci}"
    }
  }
}
EOT
}
