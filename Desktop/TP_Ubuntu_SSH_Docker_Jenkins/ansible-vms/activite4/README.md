# Activité 4 - Étape 43 : Déploiement avec Ansible

Le playbook Ansible `deploy.yml` a été exécuté depuis la VM `ansible-admin` pour déployer le portfolio sur la VM `docker-vm`.

## Fichiers
- `deploy.yml` : Playbook d'installation de Docker et de déploiement.
- `inventory.ini` : Fichier d'inventaire ciblant la VM (192.168.56.30).

## Résultat
Le playbook s'est exécuté avec succès (`failed=0`).
Le portfolio est accessible sur l'IP de la VM cible.

![Résultat Playbook Ansible](../captures-activite4/etape43-ansible.png)
![Portfolio déployé](../captures-activite4/etape43-portfolio.png)