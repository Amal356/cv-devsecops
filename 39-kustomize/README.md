# Activité 8 – Partie 37 : Kustomize (étapes 196 à 200)

Kustomize part de manifests YAML **ordinaires** (la `base`) et applique, pour chaque environnement, de petites modifications déclaratives (les `overlays`) : namespace, nombre de replicas, configuration, nom d'hôte. Pas de langage de template : `kubectl` sait l'utiliser directement (`kubectl apply -k`).

```text
                  base/  (Deployments, Services, PostgreSQL, Ingress, ConfigMaps générées, images 1.6.0)
                    │
     ┌──────────────┼───────────────┐
overlays/dev   overlays/staging  overlays/prod
portfolio-dev  portfolio-staging portfolio-prod      ← un namespace par environnement (PSS restricted)
1 + 1 replica  2 + 2 replicas    3 + 3 replicas
dev.portfolio.local  staging.…   prod.…
API_URL = http://api.portfolio-<env>.svc.cluster.local:4000
```

## Étape 196 – Structure

```text
39-kustomize/
├── base/
│   ├── kustomization.yaml      # ressources, labels communs, ConfigMaps générées, tags des images
│   ├── serviceaccount.yaml     # devsecops-app (jeton non monté)
│   ├── postgres.yaml           # PVC + Deployment + Service (une base par environnement)
│   ├── api.yaml                # Deployment + Service de l'API
│   ├── frontend.yaml           # Deployment + Service du frontend
│   └── ingress.yaml            # Ingress HTTP (hôte remplacé par chaque overlay)
└── overlays/
    ├── dev/      { kustomization.yaml, namespace.yaml }
    ├── staging/  { kustomization.yaml, namespace.yaml }
    └── prod/     { kustomization.yaml, namespace.yaml }
```

| Fichier | Rôle |
| :--- | :--- |
| [`base/kustomization.yaml`](base/kustomization.yaml) | `configMapGenerator` (`api-config`, `frontend-config`) : un hash est ajouté au nom, donc une modification de configuration relance les Pods ; `images:` fixe les tags `1.6.0` |
| [`overlays/dev/kustomization.yaml`](overlays/dev/kustomization.yaml) | `namespace`, `replicas`, fusion de `API_URL` / `CORS_ORIGIN`, patch JSON de l'hôte de l'Ingress |
| [`overlays/staging/kustomization.yaml`](overlays/staging/kustomization.yaml) | idem, 2 replicas |
| [`overlays/prod/kustomization.yaml`](overlays/prod/kustomization.yaml) | idem, 3 replicas |

Les manifests reprennent les règles de sécurité de l'activité 7 (`runAsNonRoot`, `readOnlyRootFilesystem`, `capabilities: drop ALL`, requests/limits, probes) : ils sont acceptés par PSS `restricted` et par Kyverno.

## Étapes 197 et 198 – Replicas et `API_URL` par environnement

| Environnement | Namespace | Frontend | API | `API_URL` |
| :--- | :--- | :---: | :---: | :--- |
| DEV | `portfolio-dev` | 1 | 1 | `http://api.portfolio-dev.svc.cluster.local:4000` |
| STAGING | `portfolio-staging` | 2 | 2 | `http://api.portfolio-staging.svc.cluster.local:4000` |
| PROD | `portfolio-prod` | 3 | 3 | `http://api.portfolio-prod.svc.cluster.local:4000` |

Extrait de l'overlay PROD :

```yaml
namespace: portfolio-prod
resources:
  - namespace.yaml
  - ../../base
replicas:
  - name: frontend
    count: 3
  - name: api
    count: 3
configMapGenerator:
  - name: frontend-config
    behavior: merge
    literals:
      - API_URL=http://api.portfolio-prod.svc.cluster.local:4000
```

`API_URL` utilise le **nom DNS complet** du Service : le frontend d'un environnement appelle toujours l'API de **son** environnement.

Vérification sans rien déployer (`kubectl kustomize` affiche les manifests générés) :

```bash
for e in dev staging prod; do
  echo "--- $e"
  kubectl kustomize overlays/$e | grep -E "replicas:|API_URL|^  namespace: portfolio" | sort | uniq -c
done
```

```text
--- dev
      1   API_URL: http://api.portfolio-dev.svc.cluster.local:4000
     11   namespace: portfolio-dev
      3   replicas: 1
--- staging
      1   API_URL: http://api.portfolio-staging.svc.cluster.local:4000
     11   namespace: portfolio-staging
      1   replicas: 1          ← PostgreSQL (toujours 1)
      2   replicas: 2          ← frontend et API
--- prod
      1   API_URL: http://api.portfolio-prod.svc.cluster.local:4000
     11   namespace: portfolio-prod
      1   replicas: 1
      2   replicas: 3
```

![Structure et différences entre environnements](screenshots/196-198-structure-environnements.png)

## Étape 199 – Déploiement de DEV

Les Secrets ne sont pas dans Git : ils sont créés dans le namespace avant le déploiement (mot de passe généré avec `openssl rand`).

```bash
kubectl apply -f overlays/dev/namespace.yaml
PG_PW=$(openssl rand -hex 16)
kubectl -n portfolio-dev create secret generic postgres-credentials \
  --from-literal=POSTGRES_USER=amal --from-literal=POSTGRES_PASSWORD="$PG_PW" \
  --from-literal=POSTGRES_DB=portfolio_db \
  --from-literal=DATABASE_URL="postgresql://amal:${PG_PW}@postgres:5432/portfolio_db?schema=public"
kubectl -n portfolio-dev create secret generic api-secrets --from-literal=API_DEMO_TOKEN="demo-$(openssl rand -hex 12)"
unset PG_PW
kubectl apply -k overlays/dev
kubectl -n portfolio-dev get deploy,pods,ingress
```

```text
NAME                       READY   UP-TO-DATE   AVAILABLE
deployment.apps/api        1/1     1            1
deployment.apps/frontend   1/1     1            1
deployment.apps/postgres   1/1     1            1

NAME                                CLASS     HOSTS                 ADDRESS     PORTS
ingress.networking.k8s.io/portfolio traefik   dev.portfolio.local   10.0.2.15   80

{ "status": "ok", "service": "devsecops-api", ... }
```

![Déploiement DEV](screenshots/199a-kustomize-dev.png)

Côté Windows, la ligne `127.0.0.1 dev.portfolio.local` est ajoutée au fichier `hosts` ; le port 8088 de Windows est redirigé vers le port 80 de la VM (Traefik). Le frontend de DEV affiche les données de l'API de DEV :

![DEV dans le navigateur](screenshots/199b-dev-navigateur.png)

**Problème rencontré :** au premier `kubectl apply -k`, le rollout de l'API restait bloqué sur `Waiting for deployment "api"…`. La base copiée sur la VM contenait encore `newTag: "1.4.0"` (`grep -c '1.6.0'` affichait `0`), une image qui n'existait plus dans K3s. Correction : `sed` vers `1.6.0` puis nouveau `kubectl apply -k` ; seuls les Deployments `api` et `frontend` sont `configured`, Kubernetes remplace les Pods bloqués.

## Étape 200 – Comparaison Helm / Kustomize

| Critère | Helm (partie 36) | Kustomize (partie 37) |
| :--- | :--- | :--- |
| Principe | **templates** Go (`{{ .Values.x }}`) + `values.yaml` | **YAML pur** + superpositions (patches, générateurs) |
| Outil | binaire `helm` | intégré à `kubectl` (`kubectl apply -k`) |
| Paramétrage | n'importe quelle valeur exposée dans `values.yaml` | ce que Kustomize sait modifier (namespace, replicas, images, labels, patches) |
| Lisibilité | templates parfois difficiles à lire (`nindent`, `if`, `include`) | les fichiers de la base sont de vrais manifests, lisibles et validables |
| Environnements | un fichier de valeurs par environnement (`-f values-prod.yaml`) | un dossier `overlays/<env>` par environnement |
| Cycle de vie | notion de **release** : `install`, `upgrade`, `history`, `rollback` | aucune : `apply` et c'est tout (l'historique est celui de Git) |
| Retour arrière | `helm rollback portfolio 1` | `git revert` puis `kubectl apply -k` |
| Partage / distribution | chart versionné, publiable dans un dépôt (Harbor sait stocker des charts OCI) | dossier Git, réutilisable comme base distante |
| Hooks, dépendances | oui (`pre-install`, `pre-upgrade`, sous-charts) | non |
| Utilisation avec Argo CD | supportée | supportée (format le plus simple pour GitOps) |
| Cas idéal | installer des logiciels tiers (Kyverno, Argo CD, Prometheus…) ou distribuer une application | décliner **sa propre** application en plusieurs environnements |

Conclusion : les deux outils sont complémentaires. Helm est utilisé pour **installer** les outils de la plateforme (Kyverno, Argo CD, Prometheus, Grafana…), et Kustomize pour **décliner le portfolio** en DEV / STAGING / PROD dans le dépôt GitOps (parties 39 et 40).
