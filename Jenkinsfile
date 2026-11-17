// Pipeline DevSecOps du Portfolio (Activité 2 étapes 22-24, Activité 4 étapes 61-69,
// Activité 8 étape 216 : pipeline CI/CD GitOps)
//
// Ordre (étape 216) : tests frontend -> tests API -> scans de sécurité -> build des images
//   -> SBOM -> publication Harbor + signature Cosign -> vérification -> mise à jour du dépôt GitOps.
// Le pipeline ne touche JAMAIS au cluster : il écrit le nouveau digest dans le dépôt GitOps,
// et c'est Argo CD qui déploie (étape 217).
//
// Prérequis sur la VM Jenkins (voir 18-pipeline-devsecops/README.md) :
//   - Node.js 22 et npm (déjà utilisés aux étapes 23-24)
//   - Docker, avec l'utilisateur jenkins dans le groupe docker :
//       sudo usermod -aG docker jenkins && sudo systemctl restart jenkins
//   Gitleaks, Semgrep, OWASP Dependency-Check et Trivy tournent dans des conteneurs :
//   rien d'autre à installer.
//
// Politique de sécurité (étape 69) : le pipeline ÉCHOUE si un outil trouve
//   - un secret dans le code (Gitleaks),
//   - un problème de sévérité ERROR dans le code (Semgrep),
//   - une dépendance npm de sévérité critique (npm audit),
//   - une dépendance avec un score CVSS >= 9 (Dependency-Check),
//   - une vulnérabilité CRITICAL corrigeable dans une image Docker (Trivy).

pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 120, unit: 'MINUTES')   // le 1er Dependency-Check télécharge la base NVD
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    parameters {
        // Activité 5, étape 105 : simulation d'attaque. L'image saisie passe par la même barrière
        // de signature que les images du build : si elle n'est pas signée par notre clé, le pipeline échoue.
        string(name: 'IMAGE_A_DEPLOYER', defaultValue: '',
               description: 'Facultatif : image à faire passer par la barrière de signature (ex. localhost:8090/devsecops/devsecops-api:non-signee)')
    }

    triggers {
        // Une VM en NAT n'est pas joignable par un webhook GitHub : vérification toutes les 5 min
        pollSCM('H/5 * * * *')
    }

    environment {
        REPORTS = 'reports'
        // Les conteneurs d'analyse écrivent avec l'utilisateur jenkins (fichiers supprimables)
        DOCKER_USER = sh(script: 'echo "$(id -u):$(id -g)"', returnStdout: true).trim()
        // Clé NVD facultative pour accélérer Dependency-Check : après l'avoir enregistrée
        // dans Jenkins (Secret text, ID "nvd-api-key"), remplacer '' par credentials('nvd-api-key')
        NVD_API_KEY = credentials('nvd-api-key')
        // Registre privé Harbor (Activité 5, étape 90) : HTTP sur localhost, autorisé par Docker sans configuration
        HARBOR = 'localhost:8090'
        HARBOR_PROJECT = 'devsecops'
        COSIGN_IMAGE = 'ghcr.io/sigstore/cosign/cosign:v3.1.4'
        SYFT_IMAGE = 'anchore/syft:v1.55.0'
        // Activité 8 : dépôt GitOps surveillé par Argo CD (écriture avec une deploy key SSH dédiée)
        GITOPS_REPO = 'git@github.com:Amal356/devsecops-portfolio-gitops.git'
        GITOPS_ENV = 'dev'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Étape 63 : le hash court du commit sert de tag (et de version) aux images
                    env.GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    currentBuild.description = "commit ${env.GIT_SHA}"
                }
                sh 'mkdir -p "$REPORTS"'
                echo "Commit analysé : ${env.GIT_SHA}"
            }
        }

        stage('Installation npm') {
            parallel {
                stage('API') { steps { dir('api') { sh 'npm ci' } } }
                stage('Frontend') { steps { dir('portfolio-next') { sh 'npm ci' } } }
            }
        }

        stage('1. Tests frontend') {
            steps {
                dir('portfolio-next') {
                    sh 'npm test -- --ci'
                }
            }
        }

        stage('2. Tests API') {
            steps {
                dir('api') {
                    sh 'npm test'
                }
            }
        }

        stage('3. Scans de sécurité') {
            // Étapes 64-67 : secrets, SAST, dépendances npm et CVE des bibliothèques (en parallèle)
            parallel {
                stage('Gitleaks') {
                    // Étape 64 : recherche de secrets (mots de passe, clés, jetons) dans le code
                    steps {
                        sh '''
                            docker run --rm -u "$DOCKER_USER" -v "$WORKSPACE:/src" -w /src \
                                zricethezav/gitleaks:latest detect --no-git --source /src --config /src/.gitleaks.toml \
                                --redact --verbose --exit-code 1 \
                                --report-format json --report-path /src/$REPORTS/gitleaks.json
                        '''
                    }
                }

                stage('Semgrep') {
                    // Étape 65 : analyse statique de sécurité du code JavaScript et des Dockerfiles
                    steps {
                        sh '''
                            docker run --rm -u "$DOCKER_USER" -e HOME=/tmp -v "$WORKSPACE:/src" -w /src \
                                semgrep/semgrep:latest semgrep scan \
                                --config p/javascript --config p/dockerfile --config p/owasp-top-ten \
                                --exclude node_modules --exclude .next --exclude "*.test.js" \
                                --severity ERROR --error --metrics off \
                                --json-output=$REPORTS/semgrep.json
                        '''
                    }
                }

                stage('npm audit') {
                    steps {
                        dir('api') { sh 'npm audit --omit=dev --audit-level=critical' }
                        dir('portfolio-next') { sh 'npm audit --omit=dev --audit-level=critical' }
                    }
                }

                stage('Dependency-Check') {
                    // Étape 67 : vulnérabilités connues (CVE) des bibliothèques utilisées.
                    // Le volume dependency-check-data garde la base NVD entre deux builds
                    // (le premier téléchargement est long, surtout sans clé NVD).
                    steps {
                        // L'image tourne avec son propre utilisateur : le dossier des rapports doit lui être accessible
                        sh '''
                            chmod 777 "$REPORTS"
                            docker run --rm \
                                -v "$WORKSPACE:/src" -v dependency-check-data:/usr/share/dependency-check/data \
                                owasp/dependency-check:latest \
                                --project "DevSecOps Portfolio" \
                                --scan /src/api/package-lock.json --scan /src/portfolio-next/package-lock.json \
                                --format HTML --format JSON --out /src/$REPORTS \
                                --failOnCVSS 9 ${NVD_API_KEY:+--nvdApiKey $NVD_API_KEY}
                        '''
                    }
                }
            }
        }

        stage('4. Build des images Docker') {
            // Étapes 62-63 : images taguées avec le hash du commit ; APP_VERSION est affichée par /api/health
            steps {
                sh '''
                    docker build --build-arg APP_VERSION=$GIT_SHA -t devsecops-api:$GIT_SHA api
                    docker build -t devsecops-portfolio:$GIT_SHA portfolio-next
                    docker images --filter "reference=devsecops-*" --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}" | head -5
                '''
            }
        }

        stage('5. Scan des images : Trivy') {
            // Étape 68 : vulnérabilités des images finales (système Alpine + node_modules)
            steps {
                sh '''
                    for image in devsecops-api devsecops-portfolio; do
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            -v trivy-cache:/root/.cache/trivy -v "$WORKSPACE/$REPORTS:/reports" \
                            aquasec/trivy:latest image --scanners vuln \
                            --severity HIGH,CRITICAL --format table \
                            --output /reports/trivy-$image.txt "$image:$GIT_SHA"
                        cat "$REPORTS/trivy-$image.txt"
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            -v trivy-cache:/root/.cache/trivy \
                            aquasec/trivy:latest image --scanners vuln --quiet \
                            --severity CRITICAL --ignore-unfixed --exit-code 1 "$image:$GIT_SHA"
                    done
                '''
            }
        }

        stage('6. SBOM : Syft') {
            // Activité 5, étapes 96-97 : inventaire de tous les composants de chaque image (SPDX JSON), archivé
            steps {
                sh '''
                    for image in api portfolio; do
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock "$SYFT_IMAGE" \
                            "docker:devsecops-$image:$GIT_SHA" -o spdx-json > "$REPORTS/sbom-devsecops-$image.spdx.json"
                        echo "SBOM devsecops-$image : $(grep -c '"SPDXID"' "$REPORTS/sbom-devsecops-$image.spdx.json") éléments SPDX"
                    done
                '''
            }
        }

        stage('7. Publication Harbor') {
            // Activité 5, étape 91 : push avec le robot account du projet (étape 92), jamais avec le compte admin
            steps {
                withCredentials([usernamePassword(credentialsId: 'harbor-robot',
                                                  usernameVariable: 'HARBOR_USER', passwordVariable: 'HARBOR_PASSWORD')]) {
                    sh '''
                        export DOCKER_CONFIG="$WORKSPACE/.docker-harbor"
                        mkdir -p "$DOCKER_CONFIG"
                        echo "$HARBOR_PASSWORD" | docker login "$HARBOR" -u "$HARBOR_USER" --password-stdin
                        : > "$REPORTS/images-harbor.txt"
                        for image in api portfolio; do
                            ref="$HARBOR/$HARBOR_PROJECT/devsecops-$image"
                            docker tag "devsecops-$image:$GIT_SHA" "$ref:$GIT_SHA"
                            docker push "$ref:$GIT_SHA"
                            digest=$(docker inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$ref:$GIT_SHA" | grep "^$ref@" | head -1)
                            echo "$digest" >> "$REPORTS/images-harbor.txt"
                        done
                        echo "Images publiées dans Harbor :"
                        cat "$REPORTS/images-harbor.txt"
                    '''
                }
            }
        }

        stage('8. Signature : Cosign') {
            // Activité 5, étape 99 : signature de chaque image (par digest) + SBOM attaché en attestation signée
            steps {
                withCredentials([file(credentialsId: 'cosign-key', variable: 'COSIGN_KEY_FILE'),
                                 string(credentialsId: 'cosign-password', variable: 'COSIGN_PASSWORD')]) {
                    sh '''
                        export DOCKER_CONFIG="$WORKSPACE/.docker-harbor"
                        cosign() {
                            docker run --rm --network host -u "$DOCKER_USER" \
                                -e HOME=/tmp -e COSIGN_PASSWORD -e DOCKER_CONFIG=/tmp/docker \
                                -v "$DOCKER_CONFIG:/tmp/docker:ro" -v "$COSIGN_KEY_FILE:/tmp/cosign.key:ro" \
                                -v "$WORKSPACE/$REPORTS:/reports:ro" \
                                "$COSIGN_IMAGE" "$@"
                        }
                        while read -r ref; do
                            image=${ref#*/devsecops-}; image=${image%%@*}
                            echo "=== Signature de $ref"
                            # format classique (tag .sig), sans journal public : lu par Kyverno verifyImages
                            cosign sign --yes --allow-http-registry --key /tmp/cosign.key \
                                --tlog-upload=false --new-bundle-format=false --use-signing-config=false "$ref"
                            echo "=== SBOM attaché en attestation signée"
                            cosign attest --yes --allow-http-registry --key /tmp/cosign.key \
                                --tlog-upload=false --new-bundle-format=false --use-signing-config=false \
                                --type spdxjson --predicate "/reports/sbom-devsecops-$image.spdx.json" "$ref"
                        done < "$REPORTS/images-harbor.txt"
                    '''
                }
            }
        }

        stage('9. Vérification des signatures') {
            // Activité 5, étapes 100 et 104 : aucune image n'est déployée sans signature valide de NOTRE clé.
            // Étape 105 : le paramètre IMAGE_A_DEPLOYER permet de tester une image non signée.
            steps {
                sh '''
                    export DOCKER_CONFIG="$WORKSPACE/.docker-harbor"
                    cp "$REPORTS/images-harbor.txt" "$REPORTS/a-verifier.txt"
                    if [ -n "$IMAGE_A_DEPLOYER" ]; then echo "$IMAGE_A_DEPLOYER" >> "$REPORTS/a-verifier.txt"; fi
                    refus=0
                    while read -r ref; do
                        echo "=== cosign verify $ref"
                        if docker run --rm --network host -u "$DOCKER_USER" \
                               -e HOME=/tmp -e DOCKER_CONFIG=/tmp/docker -v "$DOCKER_CONFIG:/tmp/docker:ro" \
                               -v "$WORKSPACE/40-registre-signature/cosign.pub:/tmp/cosign.pub:ro" \
                               "$COSIGN_IMAGE" verify --allow-http-registry --insecure-ignore-tlog=true --key /tmp/cosign.pub "$ref" > /dev/null; then
                            echo "SIGNATURE VALIDE : $ref"
                        else
                            echo "REFUSÉ : $ref n'est pas signée par la clé du projet"
                            refus=1
                        fi
                    done < "$REPORTS/a-verifier.txt"
                    if [ "$refus" -ne 0 ]; then
                        echo "Déploiement bloqué : au moins une image n'a pas de signature valide."
                        exit 1
                    fi
                    echo "Toutes les images sont signées : déploiement autorisé."
                '''
            }
        }

        stage('10. Mise à jour du dépôt GitOps') {
            // Étapes 216-217 : le nouveau digest (signé et vérifié) est écrit dans envs/dev du dépôt GitOps.
            // Argo CD détecte le commit et déploie ; Kyverno revérifie la signature à la création des Pods.
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'gitops-deploy-key', keyFileVariable: 'GITOPS_KEY')]) {
                    sh '''
                        export GIT_SSH_COMMAND="ssh -i $GITOPS_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=$WORKSPACE/.known_hosts_gitops"
                        rm -rf gitops && git clone -q --depth 1 "$GITOPS_REPO" gitops
                        python3 43-pipeline-gitops/maj-image-gitops.py "gitops/envs/$GITOPS_ENV/kustomization.yaml" \
                            "$REPORTS/images-harbor.txt" "$GIT_SHA"
                        cd gitops
                        git config user.name "Jenkins (pipeline DevSecOps)"
                        git config user.email "jenkins@devsecops.example.test"
                        if git diff --quiet; then
                            echo "Dépôt GitOps déjà à jour"
                        else
                            git diff
                            git commit -qam "deploy($GITOPS_ENV): images $GIT_SHA (Jenkins build #$BUILD_NUMBER)"
                            git push -q origin HEAD:main
                            echo "Dépôt GitOps mis à jour : $(git log --oneline -1)"
                        fi
                    '''
                }
            }
        }
    }
    post {
        always {
            // Les rapports restent consultables dans Jenkins (Build > Artifacts)
            archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
            sh 'rm -rf "$WORKSPACE/.docker-harbor" "$WORKSPACE/gitops"'   // identifiants Harbor et clone GitOps : jamais conservés
        }
        success {
            echo "Pipeline réussi : images devsecops-api:${env.GIT_SHA} et devsecops-portfolio:${env.GIT_SHA}"
        }
        failure {
            echo "Pipeline échoué pour le commit ${env.GIT_SHA} : voir le stage en rouge et les rapports archivés"
        }
    }
}
