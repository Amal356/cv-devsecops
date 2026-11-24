#!/usr/bin/env bash
# Activité 9, partie 51 (étape 260) : installation d'Istio 1.31.4, profil « minimal » (istiod seul),
# avec des ressources réduites pour la VM du labo.
set -euo pipefail
ISTIO_VERSION=1.31.4
cd /tmp
[ -d "istio-${ISTIO_VERSION}" ] || curl -sL https://istio.io/downloadIstio | ISTIO_VERSION=${ISTIO_VERSION} TARGET_ARCH=x86_64 sh - >/dev/null
sudo install -m 755 "/tmp/istio-${ISTIO_VERSION}/bin/istioctl" /usr/local/bin/istioctl
istioctl version --remote=false
istioctl install -y --set profile=minimal \
  --set values.pilot.resources.requests.cpu=50m \
  --set values.pilot.resources.requests.memory=256Mi \
  --set values.global.proxy.resources.requests.cpu=10m \
  --set values.global.proxy.resources.requests.memory=40Mi \
  --set values.global.proxy.resources.limits.memory=128Mi
kubectl -n istio-system rollout status deploy/istiod --timeout=5m
