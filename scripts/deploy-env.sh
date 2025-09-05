#!/bin/bash

# ================================
# STRIAE ENVIRONMENT SETUP SCRIPT
# ================================
# This script helps deploy environment variables to all Cloudflare Workers
# Make sure you have wrangler CLI installed and authenticated

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Striae Environment Variables Deployment Script${NC}"
echo "=================================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and fill in your values."
    exit 1
fi

# Source the .env file
echo -e "${YELLOW}📖 Loading environment variables from .env...${NC}"
source .env

# Validate required variables
required_vars=(
    "ACCOUNT_ID"
    "SL_API_KEY"
    "AUTH_PASSWORD"
    "KEYS_AUTH"
    "USER_DB_AUTH"
    "R2_KEY_SECRET"
    "ACCOUNT_HASH"
    "IMAGES_API_TOKEN"
    "API_TOKEN"
    "CFT_SECRET_KEY"
)

echo -e "${YELLOW}🔍 Validating required environment variables...${NC}"
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set in .env file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required variables found${NC}"

# Function to set worker secrets
set_worker_secrets() {
    local worker_name=$1
    local worker_path=$2
    shift 2
    local secrets=("$@")
    
    echo -e "\n${BLUE}🔧 Setting secrets for $worker_name...${NC}"
    cd "$worker_path"
    
    for secret in "${secrets[@]}"; do
        echo -e "${YELLOW}  Setting $secret...${NC}"
        echo "${!secret}" | wrangler secret put "$secret" --name "$(basename $worker_path)"
    done
    
    echo -e "${GREEN}✅ $worker_name secrets configured${NC}"
    cd - > /dev/null
}

# Deploy secrets to each worker
echo -e "\n${BLUE}🔐 Deploying secrets to workers...${NC}"

# Keys Worker
set_worker_secrets "Keys Worker" "workers/keys-worker" \
    "KEYS_AUTH" "USER_DB_AUTH" "R2_KEY_SECRET" "ACCOUNT_HASH" "IMAGES_API_TOKEN" "AUTH_PASSWORD"

# User Worker  
set_worker_secrets "User Worker" "workers/user-worker" \
    "USER_DB_AUTH"

# Data Worker
set_worker_secrets "Data Worker" "workers/data-worker" \
    "R2_KEY_SECRET"

# Images Worker
set_worker_secrets "Images Worker" "workers/image-worker" \
    "ACCOUNT_ID" "ACCOUNT_HASH" "API_TOKEN"

# Turnstile Worker
set_worker_secrets "Turnstile Worker" "workers/turnstile-worker" \
    "CFT_SECRET_KEY"

# PDF Worker (no secrets needed)
echo -e "\n${BLUE}📄 PDF Worker: No environment variables needed${NC}"

echo -e "\n${GREEN}🎉 All worker secrets deployed successfully!${NC}"

# Remind about Pages environment variables
echo -e "\n${YELLOW}⚠️  IMPORTANT: Don't forget to set these variables in Cloudflare Pages Dashboard:${NC}"
echo "   - SL_API_KEY" 
echo "   - AUTH_PASSWORD"

echo -e "\n${YELLOW}⚠️  ALSO REMEMBER TO:${NC}"
echo "   - Update HMAC_KEY in workers/image-worker/src/image-worker.js"
echo "   - Configure KV namespace ID in workers/user-worker/wrangler.jsonc"
echo "   - Configure R2 bucket name in workers/data-worker/wrangler.jsonc"

echo -e "\n${BLUE}📝 For manual deployment, use these commands:${NC}"
echo "   wrangler secret put VARIABLE_NAME --name worker-name"
echo -e "\n${GREEN}✨ Environment setup complete!${NC}"
