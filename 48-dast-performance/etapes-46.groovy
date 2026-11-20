// Étapes 11 à 15 du Jenkinsfile (activité 8, partie 46), insérées par ajout-etapes-jenkinsfile.py
        stage('11. Attente du déploiement DEV') {
            // Argo CD déploie le commit GitOps de l'étape 10 ; /api/health renvoie la version déployée.
            steps {
                sh '''
                    for i in $(seq 1 60); do
                        v=$(curl -s -H "Host: dev.portfolio.local" "http://$INGRESS_IP/api/health" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("version",""))' 2>/dev/null || true)
                        if [ "$v" = "$GIT_SHA" ]; then echo "DEV : version $v déployée"; exit 0; fi
                        echo "DEV : version actuelle '$v', attendue $GIT_SHA (essai $i/60)"; sleep 10
                    done
                    echo "La version $GIT_SHA n'est pas déployée en DEV après 10 minutes"; exit 1
                '''
            }
        }

        stage('12. DAST : OWASP ZAP (DEV)') {
            // Étape 238 : scan passif (baseline) de l'application en marche, frontend et API.
            // -I : les alertes sont rapportées sans faire échouer le pipeline ; le rapport HTML est archivé.
            steps {
                sh '''
                    chmod 777 "$REPORTS"
                    docker run --rm --add-host "dev.portfolio.local:$INGRESS_IP" \
                        -v "$WORKSPACE/$REPORTS:/zap/wrk:rw" "$ZAP_IMAGE" \
                        zap-baseline.py -t http://dev.portfolio.local -r zap-dev.html -J zap-dev.json -I
                    python3 -c 'import json; a=[x for s in json.load(open("reports/zap-dev.json"))["site"] for x in s["alerts"]]; [print("%-24s %s" % (x["riskdesc"], x["name"])) for x in sorted(a, key=lambda x: -int(x["riskcode"]))]' || true
                '''
            }
        }

        stage('13. Promotion GitOps DEV -> STAGING') {
            // Même digest signé, sans reconstruire l'image (étape 213)
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'gitops-deploy-key', keyFileVariable: 'GITOPS_KEY')]) {
                    sh '''
                        export GIT_SSH_COMMAND="ssh -i $GITOPS_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=$WORKSPACE/.known_hosts_gitops"
                        cd gitops && git pull -q --rebase origin main
                        python3 scripts/promouvoir.py dev staging
                        if git diff --quiet; then echo "STAGING déjà à jour"; else
                            git commit -qam "promote(staging): images $GIT_SHA depuis dev (Jenkins build #$BUILD_NUMBER)"
                            git push -q origin HEAD:main && echo "Promu vers STAGING : $(git log --oneline -1)"
                        fi
                    '''
                }
            }
        }

        stage('14. Test de charge k6 (STAGING)') {
            // Étapes 240-242 : k6 sort avec le code 99 si un seuil n'est pas respecté -> pas de promotion PROD
            steps {
                sh '''
                    for i in $(seq 1 60); do
                        v=$(curl -s -H "Host: staging.portfolio.local" "http://$INGRESS_IP/api/health" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("version",""))' 2>/dev/null || true)
                        [ "$v" = "$GIT_SHA" ] && echo "STAGING : version $v déployée" && break
                        echo "STAGING : version actuelle '$v', attendue $GIT_SHA (essai $i/60)"; sleep 10
                    done
                    [ "$v" = "$GIT_SHA" ] || { echo "Version $GIT_SHA absente de STAGING après 10 minutes"; exit 1; }
                    chmod 777 "$REPORTS"
                    rc=0
                    docker run --rm -u "$DOCKER_USER" --add-host "staging.portfolio.local:$INGRESS_IP" -e K6_NO_COLOR=true \
                        -e BASE_URL=http://staging.portfolio.local \
                        -v "$WORKSPACE/48-dast-performance:/scripts:ro" -v "$WORKSPACE/$REPORTS:/reports" \
                        "$K6_IMAGE" run --summary-export /reports/k6-staging.json /scripts/k6-api.js \
                        > "$REPORTS/k6-staging.txt" 2>&1 || rc=$?
                    cat "$REPORTS/k6-staging.txt"
                    if [ $rc -ne 0 ]; then echo "Seuils k6 non respectés (code $rc) : promotion vers PROD annulée"; exit $rc; fi
                '''
            }
        }

        stage('15. Promotion GitOps STAGING -> PROD') {
            // Étape 241 : atteinte uniquement si le test de charge k6 sur STAGING a réussi
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'gitops-deploy-key', keyFileVariable: 'GITOPS_KEY')]) {
                    sh '''
                        export GIT_SSH_COMMAND="ssh -i $GITOPS_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=$WORKSPACE/.known_hosts_gitops"
                        cd gitops && git pull -q --rebase origin main
                        python3 scripts/promouvoir.py staging prod
                        if git diff --quiet; then echo "PROD déjà à jour"; else
                            git commit -qam "promote(prod): images $GIT_SHA depuis staging après k6 (Jenkins build #$BUILD_NUMBER)"
                            git push -q origin HEAD:main && echo "Promu vers PROD : $(git log --oneline -1)"
                        fi
                    '''
                }
            }
        }
