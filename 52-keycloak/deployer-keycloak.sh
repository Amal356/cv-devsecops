#!/usr/bin/env bash
# Activité 9, partie 50 : déploie Keycloak et le realm « portfolio ».
# Tous les secrets sont GÉNÉRÉS ici et ne sont jamais écrits dans Git :
#   - mot de passe de l'administrateur Keycloak         -> Secret keycloak/keycloak-admin
#   - secret du client OIDC portfolio-web               -> Secret keycloak/keycloak-realm + portfolio-dev/oidc-client
#   - mots de passe des 3 utilisateurs de test          -> affichés UNE fois, à noter
# Relancer le script régénère tout (nouveaux mots de passe).
set -euo pipefail
cd "$(dirname "$0")"
gen() { openssl rand -base64 24 | tr -d '/+=' | cut -c1-20; }

ADMIN_PWD=$(gen); CLIENT_SECRET=$(gen); PWD_ALICE=$(gen); PWD_BOB=$(gen); PWD_CHLOE=$(gen)

kubectl apply -f k8s/00-namespace.yaml
kubectl -n keycloak create secret generic keycloak-admin \
  --from-literal=username=admin --from-literal=password="$ADMIN_PWD" --dry-run=client -o yaml | kubectl apply -f -

REALM=$(mktemp); trap 'rm -f "$REALM"' EXIT
sed -e "s/__CLIENT_SECRET__/$CLIENT_SECRET/" -e "s/__PWD_ALICE__/$PWD_ALICE/" \
    -e "s/__PWD_BOB__/$PWD_BOB/" -e "s/__PWD_CHLOE__/$PWD_CHLOE/" realm/portfolio-realm.template.json > "$REALM"
kubectl -n keycloak create secret generic keycloak-realm --from-file=portfolio-realm.json="$REALM" \
  --dry-run=client -o yaml | kubectl apply -f -

# Secret du client pour le frontend de DEV (lu par Next.js, variable OIDC_CLIENT_SECRET)
kubectl -n portfolio-dev create secret generic oidc-client --from-literal=OIDC_CLIENT_SECRET="$CLIENT_SECRET" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f k8s/01-keycloak.yaml
kubectl -n keycloak rollout restart deploy/keycloak >/dev/null 2>&1 || true
kubectl -n keycloak rollout status deploy/keycloak --timeout=6m

cat <<FIN

=== À NOTER (affiché une seule fois, jamais dans Git ni dans une capture) ===
Console d'administration : http://keycloak.local:8088/admin   admin / $ADMIN_PWD
alice-user    (user)                  : $PWD_ALICE
bob-developer (user, developer)       : $PWD_BOB
chloe-admin   (user, developer, admin): $PWD_CHLOE
FIN
