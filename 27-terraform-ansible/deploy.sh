#!/usr/bin/env bash
# Activité 6, étapes 134-135 : reconstruit tout l'environnement, sans aucune action manuelle
#   1. Floci (le « cloud »)  2. Terraform (infrastructure)  3. Ansible (serveur + application)
set -euo pipefail
cd "$(dirname "$0")"
racine=$(cd ../ && pwd)
export AWS_PROFILE=floci AWS_ENDPOINT_URL=http://localhost:4566
export TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache" && mkdir -p "$TF_PLUGIN_CACHE_DIR"
debut=$(date +%s)

echo "=== 1/3 Floci"
docker compose -f "$racine/docker-compose.fullstack.yml" --project-directory "$racine" up -d --wait floci

echo "=== 2/3 Terraform"
terraform -chdir=terraform init -input=false > /dev/null
terraform -chdir=terraform apply -auto-approve -input=false

echo "=== 3/3 Ansible"
(cd ansible && ansible-playbook playbook.yml)

echo "Environnement reconstruit en $(( $(date +%s) - debut )) secondes"
