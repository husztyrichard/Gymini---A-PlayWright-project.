pipeline {
    agent any

    stages {
        stage('Install dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Install Playwright') {
            steps {
                bat 'npx playwright install'
            }
        }

        stage('Run Playwright tests') {
            steps {
                bat 'npx playwright test'
            }
        }
    }
}
