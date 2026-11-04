# Environnement dev : seules les valeurs propres à l'environnement sont écrites ici
include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../modules/contact-stack"
}

inputs = {
  nom                      = "devsecops-tg-dev"
  retention_messages_jours = 1
  suppression_forcee       = true
  protection_suppression   = false
}
