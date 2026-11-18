# Portfolio de ${{ values.fullName }}

Projet **Next.js** généré automatiquement par **Backstage** (template `portfolio-nextjs-template`).

[![CI/CD](https://github.com/${{ values.repoSlug }}/actions/workflows/cicd.yml/badge.svg)](https://github.com/${{ values.repoSlug }}/actions/workflows/cicd.yml)

| Élément | Valeur |
| :--- | :--- |
| Application | http://localhost:3000 (santé : `/api/health`) |
| Image Docker | `${{ values.dockerhubUser }}/portfolio-nextjs:vN` – https://hub.docker.com/r/${{ values.dockerhubUser }}/portfolio-nextjs |
| Pipeline | `.github/workflows/cicd.yml` (runner sur la VM) |
| Catalogue | composant `${{ values.name }}` dans Backstage |

## Cycle de livraison

```text
Backstage ─► GitHub Actions : code ─► build ─► image vN ─► Docker Hub ─► docker compose up ─► /api/health
```

## Fichiers générés

- `app/` : application Next.js (App Router) ;
- `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `deploy.env` ;
- `.github/workflows/cicd.yml` ;
- `catalog-info.yaml` : métadonnées du composant Backstage.
