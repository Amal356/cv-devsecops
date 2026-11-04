# Environnement prod : seules les valeurs propres à l'environnement sont écrites ici
include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../modules/contact-stack"
}

inputs = {
  nom                      = "devsecops-tg-prod"
  retention_messages_jours = 14
  suppression_forcee       = false
  protection_suppression   = true
}
