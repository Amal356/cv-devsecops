# Activité 6, étapes 127-128 : state distant dans le bucket S3 de Floci, avec verrou
terraform {
  backend "s3" {
    bucket = "devsecops-tfstate"
    key    = "staging/terraform.tfstate" # un fichier de state par environnement
    region = "us-east-1"

    # Verrou natif S3 (Terraform >= 1.10) : un fichier .tflock créé par écriture conditionnelle
    use_lockfile = true
    encrypt      = true

    profile                     = "floci"
    use_path_style              = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    endpoints = {
      s3  = "http://localhost:4566"
      sts = "http://localhost:4566"
    }
  }
}
