# Environnement PROD : rétention maximale, bucket jamais vidé par destroy, table protégée
locals {
  environnement = "prod"
}

module "contact_stack" {
  source = "../../modules/contact-stack"

  nom                      = "devsecops-${local.environnement}"
  retention_messages_jours = 14
  suppression_forcee       = false
  protection_suppression   = true
}

output "ressources" {
  value = module.contact_stack
}
