#!/bin/bash

# ========================echo -e "${YELLOW}🔧 Deploying all 7 Cloudflare Workers...${NC}"=============
# STRIAE COMPLETE DEPLOYMENT SCRIPT
# ======================================
# This script deploys the entire Striae application:
# 1. Worker dependencies installation
# 2. Workers (all 7 workers)
# 3. Worker secrets/environment variables
# 4. Pages (frontend)
# 5. Pages secrets/environment variables

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Striae Complete Deployment Script${NC}"
echo "======================================"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Step 1: Install Worker Dependencies
echo -e "${PURPLE}Step 1/5: Installing Worker Dependencies${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}📦 Installing npm dependencies for all workers...${NC}"
if ! bash "$SCRIPT_DIR/install-workers.sh"; then
    echo -e "${RED}❌ Worker dependencies installation failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All worker dependencies installed successfully${NC}"
echo ""

# Step 2: Deploy Workers
echo -e "${PURPLE}Step 2/5: Deploying Workers${NC}"
echo "----------------------------"
echo -e "${YELLOW}� Deploying all 6 Cloudflare Workers...${NC}"
if ! npm run deploy-workers; then
    echo -e "${RED}❌ Worker deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All workers deployed successfully${NC}"
echo ""

# Step 2: Deploy Workers Secrets
echo -e "${PURPLE}Step 3/5: Deploying Worker Secrets${NC}"
echo "-----------------------------------"
echo -e "${YELLOW}🔐 Deploying worker environment variables...${NC}"
if ! npm run deploy-workers:secrets; then
    echo -e "${RED}❌ Worker secrets deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Worker secrets deployed successfully${NC}"
echo ""

# Step 3: Deploy Pages
echo -e "${PURPLE}Step 4/5: Deploying Pages${NC}"
echo "--------------------------"
echo -e "${YELLOW}🌐 Building and deploying Pages...${NC}"
if ! npm run deploy-pages; then
    echo -e "${RED}❌ Pages deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Pages deployed successfully${NC}"
echo ""

# Step 4: Deploy Pages Secrets
echo -e "${PURPLE}Step 5/5: Deploying Pages Secrets${NC}"
echo "----------------------------------"
echo -e "${YELLOW}🔑 Deploying Pages environment variables...${NC}"
if ! npm run deploy-pages:secrets; then
    echo -e "${RED}❌ Pages secrets deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Pages secrets deployed successfully${NC}"
echo ""

# Success summary
echo "=========================================="
echo -e "${GREEN}🎉 COMPLETE DEPLOYMENT SUCCESSFUL! 🎉${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}Deployed Components:${NC}"
echo "  ✅ Worker dependencies (npm install)"
echo "  ✅ 7 Cloudflare Workers"
echo "  ✅ Worker environment variables"
echo "  ✅ Cloudflare Pages frontend"
echo "  ✅ Pages environment variables"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Test your application endpoints"
echo "  2. Verify all services are working"
echo "  3. Configure custom domain (optional)"
echo ""
echo -e "${GREEN}✨ Your Striae application is now fully deployed!${NC}"
