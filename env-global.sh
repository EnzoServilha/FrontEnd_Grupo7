#!/bin/bash
export AWS_REGION="us-east-1"
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export REPO_NAME="repository-2nd-frontend" # Definimos no CloudFormation
export ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
export TAG="v1.0.0"