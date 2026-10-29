#!/bin/bash
# Sur ansible-admin : paire de clés SSH de l'utilisateur vagrant, utilisée par Ansible.
# La clé publique est déposée dans le dossier partagé /vagrant pour la VM docker-vm.
set -e
if [ ! -f /home/vagrant/.ssh/id_ed25519 ]; then
  sudo -u vagrant ssh-keygen -t ed25519 -N "" -C "ansible-admin" -f /home/vagrant/.ssh/id_ed25519
fi
cp /home/vagrant/.ssh/id_ed25519.pub /vagrant/admin_id_ed25519.pub
echo "Clé publique d'ansible-admin copiée dans /vagrant/admin_id_ed25519.pub"
