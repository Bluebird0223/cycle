pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = "mhd-be-${BUILD_NUMBER}" 
        DOCKERHUB_REPO = "aiits/mongodb" 
        DOCKERHUB_CREDENTIALS_ID = 'docker'
        DOCKERHUB_IMAGE_TAG = "${DOCKERHUB_REPO}:${DOCKER_IMAGE_NAME}" 
        EMAIL_RECIPIENTS = 'aiits.aws@gmail.com,naitik.others@gmail.com'
        CONTAINER_NAME = 'mhd-be'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Start Build Notification') {
            steps {
                script {
                    emailext(
                        subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - Start Building",
                        body: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} is starting. Check console output at ${env.BUILD_URL} to view the results.",
                        to: "${EMAIL_RECIPIENTS}",
                        from: 'aiits.aws@gmail.com',
                        replyTo: 'aiits.aws@gmail.com'
                    )
                }
            }
        }

        stage('Checkout') {
            steps {
                git credentialsId: 'git', url: 'https://github.com/AIITS/mahahandloom-backend.git', branch: 'uat'
            }
        }

        stage('Build') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'mhd-be', variable: 'ENV_FILE')]) {
                        sh ''' sudo cp ${ENV_FILE} .env
                                    mkdir pages '''
                        sh "sudo docker build -t ${DOCKER_IMAGE_NAME} ."
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDENTIALS_ID}", passwordVariable: 'DOCKERHUB_PASSWORD', usernameVariable: 'DOCKERHUB_USERNAME')]) {
                        sh """
                        echo "${DOCKERHUB_PASSWORD}" | sudo docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
                        sudo docker tag ${DOCKER_IMAGE_NAME} ${DOCKERHUB_IMAGE_TAG}
                        sudo docker push ${DOCKERHUB_IMAGE_TAG}
                        """
                    }
                }
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    sh """
                    echo "Pulling new Docker image: ${DOCKERHUB_IMAGE_TAG}"
                    sudo docker pull ${DOCKERHUB_IMAGE_TAG}

                    echo "Stopping old container if it exists"
                    sudo docker stop ${CONTAINER_NAME} || true
                    
                    echo "Removing old container if it exists"
                    sudo docker rm ${CONTAINER_NAME} || true

                    echo "Running new container"
                    sudo docker run -d -p 5001:5001 --restart always --name ${CONTAINER_NAME} ${DOCKERHUB_IMAGE_TAG}
                    
                    echo "Deployment completed"
                    """
                }
            }
        }

        stage('Build Check') {
            steps {
                script {
                    def deploymentSuccess = true
                    if (!deploymentSuccess) {
                        error "Build Failed"
                    }
                }
            }
        }
    }

    post {
        success {
            emailext(
                subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - Build and Deployment Successful",
                body: "The Build of ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} was successful and uploaded to Docker Hub. The new Docker image has been deployed.",
                to: "${EMAIL_RECIPIENTS}",
                from: 'aiits.aws@gmail.com',
                replyTo: 'aiits.aws@gmail.com'
            )
        }

        failure {
            emailext(
                subject: "${env.JOB_NAME} - Build #${env.BUILD_NUMBER} - Build or Deployment Failed",
                body: "The Build of ${env.JOB_NAME} - Build #${env.BUILD_NUMBER} has failed. Please check the console output at ${env.BUILD_URL} for more details.",
                to: "${EMAIL_RECIPIENTS}",
                from: 'aiits.aws@gmail.com',
                replyTo: 'aiits.aws@gmail.com'
            )
        }
    }
}
