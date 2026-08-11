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

        stage('Check Playwright Report') {
            steps {
                bat 'dir reports\\playwright-report'
                bat 'dir reports\\playwright-report\\index.html'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'reports/playwright-report/**',
                allowEmptyArchive: true

            archiveArtifacts artifacts: 'frontend/test-results/**',
                allowEmptyArchive: true

            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'reports/playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Report'
            ])
        }
    }
}
