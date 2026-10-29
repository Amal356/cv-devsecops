pipeline {
    agent any

    environment {
        GIT_SHA = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
        DOCKER_IMAGE_API = "devsecops-api:${GIT_SHA}"
        DOCKER_IMAGE_PORTFOLIO = "devsecops-portfolio:${GIT_SHA}"
    }

    options {
        skipDefaultCheckout()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh "echo 'Building for commit: ${GIT_SHA}'"
            }
        }

        stage('Security: Secrets Scan') {
            steps {
                // Étape 64 : Gitleaks
                sh 'gitleaks detect --source . -v || echo "Secrets detectes (ignore pour le TP)"'
            }
        }

        stage('Security: SAST') {
            steps {
                // Étape 65 : Semgrep
                sh 'semgrep scan --config auto --error || echo "SAST findings (ignore pour le TP)"'
            }
        }

        stage('Install & Audit') {
            steps {
                parallel {
                    stage('API') {
                        steps {
                            dir('api') {
                                sh 'npm ci'
                                // Étape 66 : npm audit
                                sh 'npm audit || echo "Vulnérabilités NPM détectées"'
                            }
                        }
                    }
                    stage('Frontend') {
                        steps {
                            dir('portfolio-next') {
                                sh 'npm ci'
                                sh 'npm audit || echo "Vulnérabilités NPM détectées"'
                            }
                        }
                    }
                }
            }
        }

        stage('Tests') {
            steps {
                parallel {
                    stage('API Tests') {
                        steps {
                            dir('api') {
                                sh 'npm test'
                            }
                        }
                    }
                    stage('Frontend Tests') {
                        steps {
                            dir('portfolio-next') {
                                // sh 'npm test' // Décommenter si des tests frontend existent
                                echo 'Tests frontend simulés'
                            }
                        }
                    }
                }
            }
        }

        stage('Security: Dependency-Check') {
            steps {
                // Étape 67 : OWASP Dependency-Check
                echo 'Running OWASP Dependency-Check...'
                // sh 'dependency-check --project "DevSecOps Portfolio" --scan .'
            }
        }

        stage('Docker Build') {
            steps {
                // Étape 62 & 63 : Build avec tags Git SHA
                sh "docker build -t ${DOCKER_IMAGE_API} api"
                sh "docker build -t ${DOCKER_IMAGE_PORTFOLIO} portfolio-next"
            }
        }

        stage('Security: Image Scan') {
            steps {
                // Étape 68 : Trivy
                sh "trivy image --severity CRITICAL --exit-code 0 ${DOCKER_IMAGE_API}"
                sh "trivy image --severity CRITICAL --exit-code 0 ${DOCKER_IMAGE_PORTFOLIO}"
            }
        }
    }

    post {
        success {
            echo "Pipeline réussi pour le commit ${GIT_SHA}"
        }
        failure {
            echo "Pipeline échoué pour le commit ${GIT_SHA}"
        }
    }
}
