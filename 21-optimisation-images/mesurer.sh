#!/usr/bin/env bash
# Mesures avant / après optimisation (étapes 85 et 87) : taille, temps de build, vulnérabilités.
#   « avant »  = Dockerfiles de l'activité 4, conservés dans 21-optimisation-images/avant/
#   « après »  = Dockerfiles multi-stage actuels (api/Dockerfile, portfolio-next/Dockerfile)
# Chaque image est construite sans cache (--no-cache) pour un temps de build comparable,
# puis scannée par Trivy 0.70.0.
# Usage, depuis la racine du dépôt : bash 21-optimisation-images/mesurer.sh
set -euo pipefail
cd "$(dirname "$0")/.."

TRIVY=aquasec/trivy:0.70.0
RESULTATS=21-optimisation-images/resultats.md

mesurer() {
    local nom=$1 dockerfile=$2 contexte=$3
    local debut fin duree taille vulns
    debut=$(date +%s)
    docker buildx build --no-cache --load -f "$dockerfile" -t "mesure-$nom" "$contexte" > "/tmp/build-$nom.log" 2>&1 \
        || { echo "Échec du build $nom, voir /tmp/build-$nom.log"; exit 1; }
    fin=$(date +%s); duree=$((fin - debut))
    taille=$(docker image inspect -f '{{.Size}}' "mesure-$nom" | awk '{printf "%.0f", $1/1000/1000}')
    vulns=$(docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v trivy-cache:/root/.cache/trivy \
              "$TRIVY" image --scanners vuln --format json --quiet "mesure-$nom" \
            | python3 -c '
import json, sys, collections
c = collections.Counter(v["Severity"] for r in json.load(sys.stdin).get("Results", []) for v in r.get("Vulnerabilities") or [])
print(" | ".join(str(n) for n in [sum(c.values()), c["CRITICAL"], c["HIGH"], c["MEDIUM"], c["LOW"]]))')
    echo "| $nom | $taille Mo | $duree s | $vulns |" | tee -a "$RESULTATS"
}

{
    echo "Mesures du $(date '+%d/%m/%Y %H:%M') sur $(hostname), Docker $(docker version -f '{{.Server.Version}}')"
    echo
    echo "| Image | Taille | Temps de build | Vulnérabilités (total) | CRITICAL | HIGH | MEDIUM | LOW |"
    echo "| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
} > "$RESULTATS"
cat "$RESULTATS"

mesurer api-avant        21-optimisation-images/avant/api.Dockerfile       api
mesurer api-apres        api/Dockerfile                                     api
mesurer portfolio-avant  21-optimisation-images/avant/portfolio.Dockerfile portfolio-next
mesurer portfolio-apres  portfolio-next/Dockerfile                          portfolio-next

docker image rm mesure-api-avant mesure-api-apres mesure-portfolio-avant mesure-portfolio-apres > /dev/null
echo; echo "Tableau enregistré dans $RESULTATS"
