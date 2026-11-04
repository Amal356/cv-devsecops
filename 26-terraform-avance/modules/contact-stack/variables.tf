# Module réutilisable « contact-stack » (Activité 6, étape 124)
variable "nom" {
  description = "Préfixe des ressources, ex. devsecops-dev"
  type        = string
}

variable "retention_messages_jours" {
  description = "Durée de conservation des messages SQS (1 à 14 jours)"
  type        = number
  default     = 4

  validation {
    condition     = var.retention_messages_jours >= 1 && var.retention_messages_jours <= 14
    error_message = "SQS accepte une rétention de 1 à 14 jours."
  }
}

variable "suppression_forcee" {
  description = "Autoriser terraform destroy à vider le bucket (true hors production)"
  type        = bool
  default     = false
}

variable "protection_suppression" {
  description = "Protéger la table DynamoDB contre la suppression (production)"
  type        = bool
  default     = false
}
