# Activité 7 – Partie 26 : Introduction à Kubernetes (étapes 136 à 143)

Le DevSecOps Portfolio (frontend Next.js, API Express, PostgreSQL) passe de Docker Compose à Kubernetes, sur un cluster **K3s** installé sur `ubuntu-server-26`.

```text
                     namespace devsecops-portfolio
 ┌──────────────────────────────────────────────────────────────────────┐
 │  Service frontend :3000 ─► Pod frontend ──API_URL=http://api:4000──┐   │
 │                                                                    ▼   │
 │  Service api :4000 ───────────────────────────────────────► Pod api   │
 │                                                                    │   │
 │  Service postgres :5432 ◄──DATABASE_URL (Secret)───────────────────┘   │
 │        └─► Pod postgres ─► PVC postgres-data (local-path, 1 Gi)        │
 └──────────────────────────────────────────────────────────────────────┘
```

## Étapes 136 et 137 – Installation de K3s et vérification du cluster

K3s est une distribution Kubernetes légère (un seul binaire) qui fournit aussi Traefik (Ingress controller), un stockage local (`local-path`) et metrics-server.

```bash
curl -sfL https://get.k3s.io | sh -
mkdir -p ~/.kube && sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown "$(id -u):$(id -g)" ~/.kube/config && chmod 600 ~/.kube/config
echo 'export KUBECONFIG=$HOME/.kube/config' >> ~/.bashrc     # kubectl sans sudo

# Images de l'application : version fixe (pas de « latest ») et import direct dans K3s, sans registre
docker tag devsecops-api:latest devsecops-api:1.4.0
docker tag devsecops-portfolio:latest devsecops-portfolio:1.4.0
docker save devsecops-api:1.4.0 devsecops-portfolio:1.4.0 postgres:16-alpine | sudo k3s ctr images import -

kubectl version
kubectl get nodes -o wide
kubectl get pods -A
```

```text
Server Version: v1.37.2+k3s1
NAME               STATUS   ROLES           VERSION        INTERNAL-IP   CONTAINER-RUNTIME
ubuntu-server-26   Ready    control-plane   v1.37.2+k3s1   10.0.2.15     containerd://2.3.7-k3s1
```

![Cluster K3s](screenshots/137-cluster.png)

> La commande `kubectl` de K3s lit par défaut `/etc/rancher/k3s/k3s.yaml`, lisible par root seulement : la variable `KUBECONFIG` pointe vers la copie personnelle `~/.kube/config` (droits `600`).

## Étape 138 – Namespace dédié

[`k8s/00-namespace.yaml`](k8s/00-namespace.yaml) : namespace `devsecops-portfolio`, avec le label `app.kubernetes.io/part-of: devsecops-portfolio` (utilisé plus tard par les policies Kyverno).

Les identifiants PostgreSQL sont placés dans un **Secret** créé en ligne de commande, avec un mot de passe aléatoire jamais écrit dans Git ni affiché :

```bash
kubectl apply -f k8s/00-namespace.yaml
PG_PW=$(openssl rand -hex 16)
kubectl -n devsecops-portfolio create secret generic postgres-credentials \
  --from-literal=POSTGRES_USER=amal --from-literal=POSTGRES_PASSWORD="$PG_PW" \
  --from-literal=POSTGRES_DB=portfolio_db \
  --from-literal=DATABASE_URL="postgresql://amal:${PG_PW}@postgres:5432/portfolio_db?schema=public"
unset PG_PW
```

## Étapes 139 et 140 – Deployments du frontend et de l'API

| Manifest | Contenu |
| :--- | :--- |
| [`k8s/10-postgres.yaml`](k8s/10-postgres.yaml) | PVC + Deployment + Service PostgreSQL : l'API lance ses migrations Prisma au démarrage, la base doit exister |
| [`k8s/20-api-deployment.yaml`](k8s/20-api-deployment.yaml) | API Express, image `devsecops-api:1.4.0`, `DATABASE_URL` lu dans le Secret |
| [`k8s/30-frontend-deployment.yaml`](k8s/30-frontend-deployment.yaml) | frontend Next.js, image `devsecops-portfolio:1.4.0`, `API_URL=http://api:4000` |

Extrait du Deployment de l'API :

```yaml
spec:
  replicas: 1
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
        - name: api
          image: devsecops-api:1.4.0
          imagePullPolicy: IfNotPresent      # image importée localement dans K3s
          ports:
            - containerPort: 4000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef: { name: postgres-credentials, key: DATABASE_URL }
```

```bash
kubectl apply -f k8s/
kubectl -n devsecops-portfolio get deploy,pods -o wide
```

```text
NAME                       READY   UP-TO-DATE   AVAILABLE   IMAGES
deployment.apps/api        1/1     1            1           devsecops-api:1.4.0
deployment.apps/frontend   1/1     1            1           devsecops-portfolio:1.4.0
deployment.apps/postgres   1/1     1            1           postgres:16-alpine
NAME                            READY   STATUS    RESTARTS
pod/api-57885dbf95-lx5v7        1/1     Running   0
pod/frontend-57c9cd6546-sz7tm   1/1     Running   0
pod/postgres-5b5f8d5647-fg9xh   1/1     Running   0
```

![Deployments et Pods](screenshots/139-140-deploiements.png)

## Étapes 141 et 142 – Services

[`k8s/21-api-service.yaml`](k8s/21-api-service.yaml) et [`k8s/31-frontend-service.yaml`](k8s/31-frontend-service.yaml) : Services `ClusterIP`, joignables uniquement dans le cluster par leur nom DNS (`api`, `frontend`, `postgres`). Chaque Service trouve ses Pods par label (`selector`).

```text
NAME       TYPE        CLUSTER-IP      PORT(S)    SELECTOR
api        ClusterIP   10.43.211.205   4000/TCP   app=api
frontend   ClusterIP   10.43.192.44    3000/TCP   app=frontend
postgres   ClusterIP   10.43.26.13     5432/TCP   app=postgres
```

![Services](screenshots/142-services.png)

## Étape 143 – Le frontend appelle l'API par le Service Kubernetes

Le frontend lit l'adresse de l'API dans `API_URL` **au moment de la requête** (rendu côté serveur) : la même image fonctionne avec Docker Compose et avec Kubernetes, seule la variable change (`http://api:4000`, le nom du Service). La page indique la source des données (« Données fournies par l'API Express » ou « API indisponible : données locales »).

```bash
kubectl -n devsecops-portfolio exec deploy/frontend -- node -e "fetch('http://api:4000/api/health').then(r=>r.text()).then(t=>console.log('API joignable depuis le frontend :', t))"
kubectl -n devsecops-portfolio port-forward svc/frontend 3000:3000 &
curl -s http://localhost:3000/ | grep -oE "Données fournies par l.{1,6}API Express"
```

```text
API joignable depuis le frontend : { "status": "ok", "service": "devsecops-api", ... }
Données fournies par l'API Express
All migrations have been successfully applied.
API DevSecOps Portfolio démarrée sur http://0.0.0.0:4000
GET /api/skills 200 5 ms
GET /api/projects 200 1 ms
```

![Communication frontend -> API](screenshots/143-communication.png)

**Constat :** un premier test lancé 1 seconde après le déploiement a échoué (`ECONNREFUSED`) : le Pod était déclaré prêt alors que l'API exécutait encore ses migrations. Cette version simple n'a pas de `readinessProbe` : c'est corrigé à l'étape 157 ([partie 30](../32-sante/README.md)).
