# Runbook – Alertes `ApiDisponibiliteSousSLO` et `ApiIndisponible`

> Étape 237. Lien placé dans l'annotation `runbook_url` des deux alertes ([`prometheusrule-slo-api.yaml`](prometheusrule-slo-api.yaml)).

| | |
| :--- | :--- |
| **Service** | API Express du DevSecOps Portfolio (`deployment/api`, namespaces `portfolio-dev`, `portfolio-staging`, `portfolio-prod`) |
| **SLO** | disponibilité ≥ 99 % (part des requêtes sans erreur 5xx) |
| **Sévérité** | critical : intervention immédiate en PROD, dans la journée en DEV et STAGING |
| **Tableau de bord** | Grafana → « Portfolio – API (requêtes, erreurs, latence) », filtre `namespace` |

## 1. Confirmer et mesurer (2 min)

1. Ouvrir l'alerte dans Prometheus (*Alerts*) ou Grafana (*Alerting*) : noter le `namespace` et la valeur de disponibilité.
2. Tableau de bord « Portfolio – API » sur ce namespace :
   - **Erreurs 5xx par route** : une seule route en erreur, ou toutes ?
   - **Pods API disponibles** : combien de Pods sont prêts ?
   - **Latence p95/p99** : une hausse avant les erreurs indique une saturation (base de données, CPU).
3. Vérifier l'état dans Kubernetes :
   ```bash
   kubectl -n <namespace> get pods -l app=api
   kubectl -n <namespace> get events --sort-by=.lastTimestamp | tail -15
   ```

## 2. Trouver la cause (5 à 10 min)

| Observation | Cause probable | Action |
| :--- | :--- | :--- |
| Pods en `CrashLoopBackOff` | erreur au démarrage (configuration, dépendance) | `kubectl -n <ns> logs deploy/api --previous --tail=50` |
| Pods `Pending` ou `Evicted` | ressources du nœud (disque, mémoire) | `kubectl describe node \| grep -E "Pressure\|Taints"` ; libérer de l'espace |
| Erreurs 5xx sur les routes qui lisent la base | PostgreSQL indisponible ou lent | `kubectl -n <ns> get pods -l app=postgres` ; logs de la base |
| `ImagePullBackOff` | Harbor arrêté ou image absente | `docker compose -f /opt/harbor/docker-compose.yml ps` |
| Erreurs depuis une livraison récente | régression dans la nouvelle version | Argo CD : historique de l'application ; Jenkins : dernier build |

Dans Loki, retrouver les requêtes en erreur et ouvrir leur trace :

```logql
{namespace="<namespace>", app="api"} | json | status >= 500
```

Cliquer sur le `trace_id` d'une ligne : la trace Tempo montre l'étape en échec (Express, Prisma/PostgreSQL, Floci).

## 3. Rétablir le service

- **Régression après livraison** : revenir à la version précédente par GitOps (jamais par `kubectl` : Argo CD annulerait la modification) :
  ```bash
  cd ~/devsecops-portfolio-gitops
  git revert --no-edit HEAD        # annule le dernier commit de déploiement de cet environnement
  git push
  ```
- **Pod bloqué** : `kubectl -n <ns> delete pod <pod>` (le ReplicaSet le recrée).
- **Base de données** : redémarrer le Pod PostgreSQL ; les données sont conservées sur son volume.
- **Nœud saturé** : nettoyer les images inutilisées (`sudo k3s crictl rmi --prune`, `docker image prune -f`).

## 4. Vérifier le retour à la normale

- La disponibilité repasse au-dessus de 99 % : `api:sli_disponibilite:ratio_rate5m{namespace="<ns>"}` dans Prometheus.
- L'alerte passe à l'état *inactive* quelques minutes plus tard.
- Aucun nouveau redémarrage : `kubectl -n <ns> get pods -l app=api`.

## 5. Après l'incident

Rédiger un court compte rendu (cause, durée, impact sur le budget d'erreur de 1 %, actions correctives), et ajouter un test ou une alerte si l'incident n'a pas été détecté assez tôt.
