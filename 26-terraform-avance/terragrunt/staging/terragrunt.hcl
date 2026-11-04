# Environnement staging : seules les valeurs propres à l'environnement sont écrites ici
include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../modules/contact-stack"
}

inputs = {
  nom                      = "devsecops-tg-staging"
  retention_messages_jours = 4
  suppression_forcee       = true
  protection_suppression   = false
}
