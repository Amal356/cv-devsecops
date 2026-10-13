pipeline {
    agent any

    options {
        // On fait le checkout nous-mêmes dans le stage "Checkout"
        skipDefaultCheckout()
    }

    triggers {
        // Jenkins vérifie GitHub toutes les 5 minutes et relance le pipeline s'il y a un nouveau commit
        pollSCM('H/5 * * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
                sh 'ls portfolio-next'
            }
        }

        stage('Install') {
            steps {
                dir('portfolio-next') {
                    sh 'node -v'
                    sh 'npm -v'
                    // npm ci installe exactement les versions de package-lock.json
                    sh 'npm ci'
                }
            }
        }
    }
}
