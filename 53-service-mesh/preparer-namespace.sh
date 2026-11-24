#!/usr/bin/env bash
# Étape 261 : namespace portfolio-mesh (injection automatique du sidecar Envoy) + namespace hors-mesh (témoin).
# Les secrets sont COPIÉS depuis portfolio-dev (jamais dans Git). Les images v1 / v2 de l'API et
# l'image du frontend sont lues dans les environnements existants, puis injectées dans les manifestes.
set -euo pipefail
cd "$(dirname "$0")"
kubectl apply -f k8s/00-namespaces.yaml
for s in postgres-credentials api-secrets harbor-pull; do
  kubectl -n portfolio-dev get secret "$s" -o json \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); m=d["metadata"]; d["metadata"]={"name":m["name"],"namespace":"portfolio-mesh"}; print(json.dumps(d))' \
    | kubectl apply -f -
done
API_V1="localhost:8090/devsecops/devsecops-api:9be84de@sha256:ea4274ecc158369242c8007b9147e79a8dd5747e22f5f80408df716fcc418f0d"
API_V2=$(kubectl -n portfolio-dev get deploy api -o jsonpath='{.spec.template.spec.containers[0].image}')
FRONT=$(kubectl -n portfolio-dev get deploy frontend -o jsonpath='{.spec.template.spec.containers[0].image}')
echo "API v1 : $API_V1"; echo "API v2 : $API_V2"; echo "Frontend : $FRONT"
sed -e "s#__API_V1__#$API_V1#" -e "s#__API_V2__#$API_V2#" -e "s#__FRONTEND__#$FRONT#" k8s/01-application.yaml | kubectl apply -f -
