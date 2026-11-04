# Activité 6, étape 119 : variables du projet
variable "region" {
  description = "Région AWS (émulée par Floci)"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "Profil AWS CLI contenant les identifiants fictifs de Floci"
  type        = string
  default     = "floci"
}

variable "floci_endpoint" {
  description = "Adresse de Floci, émulateur AWS local"
  type        = string
  default     = "http://localhost:4566"
}

variable "environnement" {
  description = "Nom de l'environnement (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environnement)
    error_message = "L'environnement doit être dev, staging ou prod."
  }
}

variable "prefixe" {
  description = "Préfixe commun au nom des ressources"
  type        = string
  default     = "devsecops"
}
