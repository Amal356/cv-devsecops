#!/usr/bin/env bash
# Installation de Harbor (registre privé, étape 90) sur ubuntu-server-26
#
#   - Harbor v2.15.4, installeur « online » (les images sont téléchargées depuis Docker Hub)
#   - HTTP sur le port 8090, nom d'hôte localhost :
#       * Jenkins et Docker sur la VM y accèdent par localhost:8090 (Docker autorise HTTP sur localhost) ;
#       * Windows y accède par la redirection de port VirtualBox 8090 -> 8090.
#   - Trivy intégré (--with-trivy) pour le scan automatique des images (étape 93)
#   - Mots de passe admin et base de données demandés / générés : rien n'est écrit dans Git
#
# Usage : sudo bash install-harbor.sh
set -euo pipefail

VERSION=v2.15.4
PORT=8090
DIR=/opt/harbor

[ "$(id -u)" -eq 0 ] || { echo "Lancer avec sudo"; exit 1; }

if ss -ltn | grep -q ":$PORT "; then
    echo "Le port $PORT est déjà utilisé :"; ss -ltnp | grep ":$PORT "; exit 1
fi

read -r -s -p "Mot de passe administrateur Harbor (12 caractères min., majuscule, minuscule, chiffre) : " ADMIN_PASSWORD; echo
DB_PASSWORD=$(openssl rand -hex 16)

cd /opt
if [ ! -d "$DIR" ]; then
    curl -fL --progress-bar -o "harbor-online-installer-$VERSION.tgz" \
        "https://github.com/goharbor/harbor/releases/download/$VERSION/harbor-online-installer-$VERSION.tgz"
    tar xzf "harbor-online-installer-$VERSION.tgz"
    rm "harbor-online-installer-$VERSION.tgz"
fi
cd "$DIR"

cp harbor.yml.tmpl harbor.yml
sed -i \
    -e "s/^hostname: .*/hostname: localhost/" \
    -e "s/^  port: 80$/  port: $PORT/" \
    -e "s/^https:/#https:/" \
    -e "s/^  port: 443$/#  port: 443/" \
    -e "s|^  certificate: /your/certificate/path|#  certificate: /your/certificate/path|" \
    -e "s|^  private_key: /your/private/key/path|#  private_key: /your/private/key/path|" \
    -e "s/^harbor_admin_password: .*/harbor_admin_password: $ADMIN_PASSWORD/" \
    -e "0,/^  password: root123/s//  password: $DB_PASSWORD/" \
    harbor.yml
chmod 600 harbor.yml

echo "--- Configuration retenue (sans les mots de passe) :"
grep -nE "^(hostname|http:|  port|#https|harbor_admin_password|data_volume)" harbor.yml | sed 's/harbor_admin_password: .*/harbor_admin_password: ********/'

./install.sh --with-trivy

echo
echo "Harbor est démarré : http://localhost:$PORT (utilisateur admin)."
echo "Depuis Windows : ajouter la redirection VirtualBox 8090 -> 8090 (voir 22-harbor/README.md)."
docker compose -f "$DIR/docker-compose.yml" ps
