#!/usr/bin/env bash
# Activité 9, partie 52 (étape 266) : Actions Runner Controller dans Kubernetes.
# Le jeton GitHub est demandé au clavier (invisible), rangé dans un Secret Kubernetes, puis oublié :
# il n'apparaît ni dans Git, ni dans l'historique du terminal, ni à l'écran.
set -euo pipefail
cd "$(dirname "$0")"
VERSION=0.15.1
helm upgrade --install arc --namespace arc-systems --create-namespace \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller --version "$VERSION" --wait
kubectl apply -f k8s/00-namespace-runners.yaml -f k8s/01-networkpolicy.yaml
if ! kubectl -n arc-runners get secret arc-github-pat >/dev/null 2>&1; then
  read -rsp "Colle le jeton GitHub (fine-grained, Administration RW sur cv-devsecops) puis Entrée : " PAT; echo
  kubectl -n arc-runners create secret generic arc-github-pat --from-literal=github_token="$PAT" >/dev/null
  unset PAT
  echo "Secret arc-github-pat créé"
fi
helm upgrade --install arc-cv-devsecops --namespace arc-runners \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set --version "$VERSION" \
  -f arc/values-runners.yaml --wait
sleep 20
kubectl -n arc-systems get pods
kubectl -n arc-runners get autoscalingrunnerset
