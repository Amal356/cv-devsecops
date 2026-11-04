# Environnement STAGING : proche de la production, destroy autorisé pour les tests
locals {
  environnement = "staging"
}

module "contact_stack" {
  source = "../../modules/contact-stack"

  nom                      = "devsecops-${local.environnement}"
  retention_messages_jours = 4
  suppression_forcee       = true
  protection_suppression   = false
}

output "ressources" {
  value = module.contact_stack
}
