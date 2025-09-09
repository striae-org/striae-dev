#!/bin/bash

# ======================================
# STRIAE COMPLETE DEPLOYMENT SCRIPT
# ======================================
# This script deploys the entire Striae application:
# 1. Workers (all 6 workers)
# 2. Worker secrets/environment variables
# 3. Pages (frontend)
# 4. Pages secrets/environment variables

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

# Step 1: Deploy Workers
echo -e "${PURPLE}Step 1/4: Deploying Workers${NC}"
echo "----------------------------"
echo -e "${YELLOW}📦 Deploying all 6 Cloudflare Workers...${NC}"
if ! npm run deploy-workers; then
    echo -e "${RED}❌ Worker deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All workers deployed successfully${NC}"
echo ""

# Step 2: Deploy Worker Secrets
echo -e "${PURPLE}Step 2/4: Deploying Worker Secrets${NC}"
echo "-----------------------------------"
echo -e "${YELLOW}🔐 Deploying worker environment variables...${NC}"
if ! npm run deploy-workers:secrets; then
    echo -e "${RED}❌ Worker secrets deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Worker secrets deployed successfully${NC}"
echo ""

# Step 3: Deploy Pages
echo -e "${PURPLE}Step 3/4: Deploying Pages${NC}"
echo "--------------------------"
echo -e "${YELLOW}🌐 Building and deploying Pages...${NC}"
if ! npm run deploy-pages; then
    echo -e "${RED}❌ Pages deployment failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Pages deployed successfully${NC}"
echo ""

# Step 4: Deploy Pages Secrets
echo -e "${PURPLE}Step 4/4: Deploying Pages Secrets${NC}"
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
echo "  ✅ 6 Cloudflare Workers"
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
