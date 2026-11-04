# 1. Infrastructure cloud (Floci) : le module réutilisable de la partie 24
module "contact_stack" {
  source = "../../26-terraform-avance/modules/contact-stack"

  nom                      = "devsecops-app"
  retention_messages_jours = 4
  suppression_forcee       = true # environnement reconstructible (étape 135)
  protection_suppression   = false
}

# 2. Passage de relais à Ansible : Terraform écrit l'inventaire et les variables
#    (noms réels des ressources créées). Ces fichiers générés ne sont pas commités.
resource "local_file" "inventaire" {
  filename        = "${path.module}/../ansible/inventory.ini"
  file_permission = "0644"
  content         = <<-EOT
    # Généré par Terraform (étape 134) - ne pas modifier à la main
    [serveurs]
    ubuntu-server-26 ansible_connection=local
  EOT
}

resource "local_file" "variables_ansible" {
  filename        = "${path.module}/../ansible/terraform_vars.yml"
  file_permission = "0644"
  content = yamlencode({
    contact_bucket     = module.contact_stack.bucket_contacts
    contact_queue_name = split("/", module.contact_stack.file_notifications)[4]
    contact_queue_url  = module.contact_stack.file_notifications
    contact_table      = module.contact_stack.table_contacts
  })
}

output "infrastructure" {
  value = module.contact_stack
}
