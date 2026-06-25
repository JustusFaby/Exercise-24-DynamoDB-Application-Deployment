# Customer App - DynamoDB Application Deployment

## Links & Demo

- **Live API Endpoint (LoadBalancer):** `http://a76e311dbd98d4e1a84a7af1fb1be86c-1625380515.us-east-1.elb.amazonaws.com`
- **Video Demo:** [Watch Demo on Google Drive](https://drive.google.com/file/d/1HrAkfHiXDHaA1R_3ndAWllfj5ZglhAjT/view?usp=sharing)
- **Postman Collection:** `postman_collection.json` (included in repository)

## Project Overview

This project is a RESTful Node.js application that interacts with Amazon DynamoDB to manage customer records. It leverages **Clean Architecture** and follows best practices for production-readiness. The key focus is on deploying to Amazon Elastic Kubernetes Service (EKS) securely, using **IAM Roles for Service Accounts (IRSA)** for authentication to AWS without hardcoding any credentials or Access Keys.

## Architecture

- **Backend**: Node.js, Express.js
- **Database**: Amazon DynamoDB
- **AWS SDK**: AWS SDK for JavaScript v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)
- **Containerization**: Docker
- **Orchestration**: Kubernetes (Amazon EKS)
- **Security**: IRSA (IAM Roles for Service Accounts)

## Folder Structure

```
customer-app/
│ package.json
│ Dockerfile
│ README.md
│ .gitignore
│ .env.sample
│ postman_collection.json
│
├── src/
│   ├── server.js
│   ├── routes/
│   │   └── customer.js
│   ├── controllers/
│   │   └── customerController.js
│   ├── services/
│   │   └── dynamodbService.js
│   └── config/
│       └── aws.js
│
└── k8s/
    ├── deployment.yaml
    ├── service.yaml
    └── serviceaccount.yaml
```

## Prerequisites

- Node.js installed locally
- Docker installed locally
- `kubectl` configured and connected to your EKS cluster
- AWS CLI configured with administrative access to manage EKS, ECR, IAM, and DynamoDB.

## IAM Policy

The required IAM Policy to attach to the `DynamoDBIRSARole` allows access ONLY to DynamoDB.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem"
            ],
            "Resource": "arn:aws:dynamodb:<REGION>:<ACCOUNT_ID>:table/Customers"
        }
    ]
}
```

## Docker Build

To build the Docker image locally:

```bash
docker build -t customer-app .
```

## Docker Run

You can run the docker container locally by passing the environment variables. *Note: Local Docker execution requires AWS credentials unless run on EC2/EKS with an associated role, so ensure you have environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` set only for local testing if needed.*

```bash
docker run -p 3000:3000 \
  -e AWS_REGION=us-east-1 \
  -e TABLE_NAME=Customers \
  customer-app
```

## Create ECR Repository

Create an Amazon ECR repository to store the Docker image:

```bash
aws ecr create-repository --repository-name customer-app --region <AWS_REGION>
```

## Push Docker Image

Authenticate your Docker client, tag your image, and push it to ECR:

```bash
# Authenticate Docker
aws ecr get-login-password --region <AWS_REGION> | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com

# Tag Image
docker tag customer-app:latest <ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/customer-app:latest

# Push Image
docker push <ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/customer-app:latest
```

## Deploy to EKS

Ensure your `kubectl` context is set to your EKS cluster. First, update `k8s/deployment.yaml` and `k8s/serviceaccount.yaml` with your actual `<ACCOUNT_ID>` and `<YOUR_ECR_REPO_URI>`.

```bash
# Apply Service Account
kubectl apply -f k8s/serviceaccount.yaml

# Apply Deployment
kubectl apply -f k8s/deployment.yaml

# Apply Service
kubectl apply -f k8s/service.yaml
```

## Create EKS Cluster (Fargate)

To avoid EC2 Instance limits on free tier accounts, it is highly recommended to use a serverless EKS cluster with AWS Fargate.

```bash
eksctl create cluster --name customer-app-cluster --region <AWS_REGION> --fargate
```

## Create Service Account & Associate IAM Role (Using eksctl)

Instead of manually creating the OIDC provider and Trust Policy, the easiest way to map the IAM Role and Kubernetes Service Account is to use `eksctl`:

```bash
# 1. Associate the OIDC Provider
eksctl utils associate-iam-oidc-provider --cluster customer-app-cluster --approve

# 2. Map the IAM Role to the Kubernetes ServiceAccount
eksctl create iamserviceaccount \
  --name customer-app-sa \
  --namespace default \
  --cluster customer-app-cluster \
  --attach-policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/CustomerAppDynamoDBPolicy \
  --approve \
  --override-existing-serviceaccounts
```

## Verify IRSA

To verify that the IAM Role credentials are being injected correctly, you can start a shell inside the pod and check for the environment variables injected by the AWS mutating admission webhook:

```bash
# Get the pod name
kubectl get pods

# Exec into the pod
kubectl exec -it <pod-name> -- /bin/sh

# Verify environment variables
env | grep AWS_ROLE_ARN
env | grep AWS_WEB_IDENTITY_TOKEN_FILE
```

## kubectl commands

Here are some helpful commands to manage and troubleshoot the deployment:

- **View Pods:** `kubectl get pods -l app=customer-app`
- **View Service:** `kubectl get svc customer-app-service`
- **View Logs:** `kubectl logs -f deployment/customer-app`
- **Describe Deployment:** `kubectl describe deployment customer-app`
- **Describe Service Account:** `kubectl describe sa customer-app-sa`

## API Examples & Expected Output

### Create Customer (POST /customers)

**Request:**
```bash
curl -X POST http://<LoadBalancer-DNS>/customers \
     -H "Content-Type: application/json" \
     -d '{
           "name": "John",
           "email": "john@gmail.com",
           "phone": "9999999999",
           "address": "Chennai"
         }'
```

**Expected Output (201 Created):**
```json
{
  "customerId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "name": "John",
  "email": "john@gmail.com",
  "phone": "9999999999",
  "address": "Chennai"
}
```

### Read Customer (GET /customers/:id)

**Request:**
```bash
curl -X GET http://<LoadBalancer-DNS>/customers/d290f1ee-6c54-4b01-90e6-d701748f0851
```

**Expected Output (200 OK):**
```json
{
  "customerId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "name": "John",
  "email": "john@gmail.com",
  "phone": "9999999999",
  "address": "Chennai"
}
```

### Update Customer (PUT /customers/:id)

**Request:**
```bash
curl -X PUT http://<LoadBalancer-DNS>/customers/d290f1ee-6c54-4b01-90e6-d701748f0851 \
     -H "Content-Type: application/json" \
     -d '{
           "address": "Bangalore",
           "phone": "8888888888"
         }'
```

**Expected Output (200 OK):**
```json
{
  "address": "Bangalore",
  "phone": "8888888888",
  "email": "john@gmail.com",
  "customerId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "name": "John"
}
```

## Testing using Postman

You can import the provided `postman_collection.json` file located in the root of the project into Postman. Update the `{{baseUrl}}` variable to match your service's LoadBalancer IP or DNS.

## Troubleshooting

1. **AccessDeniedException from DynamoDB**: Ensure that the ServiceAccount annotation matches the IAM Role ARN correctly, and that the IAM Role has the correct Trust Policy allowing `sts:AssumeRoleWithWebIdentity` from the EKS cluster's OIDC provider.
2. **Pod Crashing**: Check the pod logs via `kubectl logs <pod-name>`. Check if `AWS_REGION` or `TABLE_NAME` are correctly set.
3. **Service Not Reachable**: If the LoadBalancer is pending or unavailable, verify your AWS VPC subnets are tagged correctly for external load balancers.

## Cleanup

To avoid incurring future AWS charges ($0.10/hr for the EKS control plane), completely delete the cluster and ECR repository when you are done:

```bash
# Delete the cluster
eksctl delete cluster --name customer-app-cluster --region <AWS_REGION>

# Delete the image repository
aws ecr delete-repository --repository-name customer-app --force --region <AWS_REGION>
```
