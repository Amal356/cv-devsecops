#!/usr/bin/env bash
# Activité 6, étape 135 : supprime toute l'infrastructure (les données PostgreSQL sont conservées)
set -euo pipefail
cd "$(dirname "$0")"
racine=$(cd ../ && pwd)
export AWS_PROFILE=floci AWS_ENDPOINT_URL=http://localhost:4566

echo "=== Terraform destroy (ressources S3, SQS, DynamoDB)"
terraform -chdir=terraform destroy -auto-approve -input=false

echo "=== Arrêt et suppression des conteneurs (Floci, API, portfolio, PostgreSQL)"
docker compose -f "$racine/docker-compose.fullstack.yml" --project-directory "$racine" down
rm -f "$racine/.env.infra"
docker ps -a --filter name=devsecops --filter name=floci --format '{{.Names}}' | grep . || echo "Plus aucun conteneur du projet"
