#!/usr/bin/env python3
"""Étape 216 : écrit les images publiées par Jenkins dans un environnement du dépôt GitOps.

    python3 maj-image-gitops.py <kustomization.yaml> <images-harbor.txt> <tag>

images-harbor.txt contient une ligne par image : localhost:8090/devsecops/devsecops-api@sha256:…
Pour chaque image, le bloc correspondant de « images: » reçoit le nouveau tag (hash du commit)
et le nouveau DIGEST : Argo CD déploiera exactement l'image signée et vérifiée par le pipeline.
"""
import re, sys

fichier, liste, tag = sys.argv[1], sys.argv[2], sys.argv[3]
texte = open(fichier).read()
for ligne in open(liste).read().split():
    nom, digest = ligne.split("@")
    motif = re.compile(r"(newName: " + re.escape(nom) + r'\n\s+newTag: )"[^"]*"(\n\s+digest: )\S+')
    texte, n = motif.subn(lambda m: f'{m.group(1)}"{tag}"{m.group(2)}{digest}', texte)
    if n != 1:
        sys.exit(f"ERREUR : bloc images introuvable pour {nom} dans {fichier}")
    print(f"{fichier} : {nom.split('/')[-1]} -> {tag} @ {digest[:19]}…")
open(fichier, "w").write(texte)
