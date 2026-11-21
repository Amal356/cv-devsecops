#!/usr/bin/env bash
# Activité 9, partie 47 : prépare le namespace de démonstration portfolio-rollouts.
# Les secrets (base de données, jeton de démo, accès Harbor) sont COPIÉS depuis portfolio-dev :
# ils ne sont jamais écrits dans Git.
set -euo pipefail
NS=portfolio-rollouts
kubectl apply -f k8s/00-namespace.yaml
for s in postgres-credentials api-secrets harbor-pull; do
  kubectl -n portfolio-dev get secret "$s" -o json \
    | python3 -c 'import sys,json; d=json.load(sys.stdin); m=d["metadata"]; d["metadata"]={"name":m["name"],"namespace":"'"$NS"'"}; print(json.dumps(d))' \
    | kubectl apply -f -
done
CM=$(kubectl -n portfolio-dev get cm -o name | grep -m1 'api-config')
kubectl -n portfolio-dev get "$CM" -o json \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); d["metadata"]={"name":"api-config","namespace":"'"$NS"'"}; print(json.dumps(d))' \
  | kubectl apply -f -
echo "Namespace $NS prêt"
