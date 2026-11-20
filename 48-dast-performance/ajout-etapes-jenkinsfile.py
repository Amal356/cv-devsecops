"""Ajoute au Jenkinsfile les étapes 11 à 15 de l'activité 8 (partie 46 : DAST et tests de performance).

    python3 48-dast-performance/ajout-etapes-jenkinsfile.py Jenkinsfile
"""
import sys

chemin = sys.argv[1]
texte = open(chemin, encoding="utf-8").read()
if "11. Attente du déploiement DEV" in texte:
    sys.exit("Étapes déjà présentes : rien à faire")

# 1. Adresse de l'Ingress Traefik (les noms *.portfolio.local ne sont pas dans /etc/hosts)
ancre_env = "        GITOPS_ENV = 'dev'\n"
assert ancre_env in texte, "variable GITOPS_ENV introuvable"
texte = texte.replace(ancre_env, ancre_env +
    "        // Activité 8, partie 46 : Ingress Traefik du cluster K3s (dev.portfolio.local, staging.portfolio.local)\n"
    "        INGRESS_IP = '10.0.2.15'\n"
    "        ZAP_IMAGE = 'ghcr.io/zaproxy/zaproxy:stable'\n"
    "        K6_IMAGE = 'grafana/k6:latest'\n", 1)

# 2. Commentaire d'en-tête
ancre_entete = "//   -> SBOM -> publication Harbor + signature Cosign -> vérification -> mise à jour du dépôt GitOps.\n"
if ancre_entete in texte:
    texte = texte.replace(ancre_entete, ancre_entete +
        "// Partie 46 (étapes 238-242) : attente du déploiement DEV -> DAST OWASP ZAP sur DEV\n"
        "//   -> promotion DEV -> STAGING -> test de charge k6 sur STAGING -> promotion STAGING -> PROD\n"
        "//   (la promotion vers PROD n'a lieu que si les seuils k6 sont respectés).\n", 1)

import os
ETAPES = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "etapes-46.groovy"), encoding="utf-8").read().split("\n", 1)[1]

ancre_fin = "\n    }\n    post {"
assert texte.count(ancre_fin) == 1, "fin du bloc stages introuvable"
texte = texte.replace(ancre_fin, "\n" + ETAPES.rstrip("\n") + ancre_fin, 1)
open(chemin, "w", encoding="utf-8").write(texte)
print("Étapes 11 à 15 ajoutées au Jenkinsfile")
