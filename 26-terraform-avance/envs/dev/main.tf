# Environnement DEV : rétention courte, destroy autorisé
locals {
  environnement = "dev"
}

module "contact_stack" {
  source = "../../modules/contact-stack"

  nom                      = "devsecops-${local.environnement}"
  retention_messages_jours = 1
  suppression_forcee       = true
  protection_suppression   = false
}

output "ressources" {
  value = module.contact_stack
}
