pipeline {
    agent any

    stages {
        stage('Install dependencies') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                }
            }
        }

        stage('Install Playwright') {
            steps {
                dir('frontend') {
                    bat 'npx playwright install'
                }
            }
        }

        stage('Run Playwright tests') {
            steps {
                dir('frontend') {
                    bat 'npx playwright test'
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'reports/playwright-report/**',
                allowEmptyArchive: true

            archiveArtifacts artifacts: 'frontend/test-results/**',
                allowEmptyArchive: true
        }
    }
}
