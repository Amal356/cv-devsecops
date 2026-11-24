#!/usr/bin/env bash
# Activité 9, partie 49 (étape 253) : installation de Velero avec Floci comme stockage S3.
# Les identifiants S3 sont lus dans les variables S3_ACCESS_KEY / S3_SECRET_KEY,
# écrits dans un fichier temporaire pour "velero install", puis supprimés : jamais dans Git.
set -euo pipefail
: "${S3_ACCESS_KEY:?définir S3_ACCESS_KEY}" "${S3_SECRET_KEY:?définir S3_SECRET_KEY}"
VELERO_VERSION=v1.19.0
PLUGIN_AWS=v1.15.0

# CLI
curl -sL "https://github.com/vmware-tanzu/velero/releases/download/${VELERO_VERSION}/velero-${VELERO_VERSION}-linux-amd64.tar.gz" | tar xz -C /tmp
sudo install -m 755 "/tmp/velero-${VELERO_VERSION}-linux-amd64/velero" /usr/local/bin/velero

# Serveur
CRED=$(mktemp)
trap 'rm -f "$CRED"' EXIT
printf '[default]\naws_access_key_id=%s\naws_secret_access_key=%s\n' "$S3_ACCESS_KEY" "$S3_SECRET_KEY" > "$CRED"
velero install \
  --provider aws \
  --plugins "velero/velero-plugin-for-aws:${PLUGIN_AWS}" \
  --bucket velero-backups \
  --secret-file "$CRED" \
  --backup-location-config region=us-east-1,s3ForcePathStyle="true",s3Url=http://floci.floci.svc.cluster.local:4566 \
  --use-volume-snapshots=false \
  --use-node-agent \
  --default-volumes-to-fs-backup \
  --wait
velero backup-location get
