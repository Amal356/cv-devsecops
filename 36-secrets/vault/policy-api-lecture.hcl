# Étape 179 : droits Vault minimaux pour External Secrets Operator
# Lecture seule du secret de l'API, rien d'autre
path "secret/data/devsecops/api" {
  capabilities = ["read"]
}
