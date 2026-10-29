// Pipeline DevSecOps du Portfolio (Activité 2 étapes 22-24, Activité 4 étapes 61-69)
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
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Étape 63 : le hash court du commit sert de tag aux images Docker
                    env.GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    currentBuild.description = "commit ${env.GIT_SHA}"
                }
                sh 'mkdir -p "$REPORTS"'
                echo "Commit analysé : ${env.GIT_SHA}"
            }
        }

        stage('Secrets : Gitleaks') {
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

        stage('SAST : Semgrep') {
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

        stage('Installation et audit npm') {
            // Étapes 23 et 66 : npm ci puis npm audit (échec si une dépendance est critique)
            parallel {
                stage('API') {
                    steps {
                        dir('api') {
                            sh 'npm ci'
                            sh 'npm audit --omit=dev --audit-level=critical'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('portfolio-next') {
                            sh 'npm ci'
                            sh 'npm audit --omit=dev --audit-level=critical'
                        }
                    }
                }
            }
        }

        stage('Tests') {
            // Étape 61 : tests automatisés du frontend et de l'API
            parallel {
                stage('Tests API') {
                    steps {
                        dir('api') {
                            sh 'npm test'
                        }
                    }
                }
                stage('Tests frontend') {
                    steps {
                        dir('portfolio-next') {
                            sh 'npm test -- --ci'
                        }
                    }
                }
            }
        }

        stage('Build Next.js') {
            // Étape 24 : le build de production doit réussir
            steps {
                dir('portfolio-next') {
                    sh 'npm run build'
                }
            }
        }

        stage('Dépendances : OWASP Dependency-Check') {
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

        stage('Build des images Docker') {
            // Étapes 62 et 63 : images taguées avec le hash du commit (et latest)
            steps {
                sh '''
                    docker build -t devsecops-api:$GIT_SHA -t devsecops-api:latest api
                    docker build -t devsecops-portfolio:$GIT_SHA -t devsecops-portfolio:latest portfolio-next
                    docker images --filter "reference=devsecops-*" --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}"
                '''
            }
        }

        stage('Images : Trivy') {
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
    }

    post {
        always {
            // Les rapports restent consultables dans Jenkins (Build > Artifacts)
            archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
        }
        success {
            echo "Pipeline réussi : images devsecops-api:${env.GIT_SHA} et devsecops-portfolio:${env.GIT_SHA}"
        }
        failure {
            echo "Pipeline échoué pour le commit ${env.GIT_SHA} : voir le stage en rouge et les rapports archivés"
        }
    }
}
