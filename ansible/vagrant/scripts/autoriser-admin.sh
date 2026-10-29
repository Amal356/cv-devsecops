#!/bin/bash
# Sur docker-vm : autorise la clé SSH d'ansible-admin à se connecter (utilisateur vagrant).
set -e
CLE=/vagrant/admin_id_ed25519.pub
if [ ! -f "$CLE" ]; then
  echo "Clé introuvable : lancer d'abord 'vagrant up ansible-admin'" >&2
  exit 1
fi
grep -qxF "$(cat "$CLE")" /home/vagrant/.ssh/authorized_keys || cat "$CLE" >> /home/vagrant/.ssh/authorized_keys
echo "Clé d'ansible-admin autorisée sur docker-vm"
