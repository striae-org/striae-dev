# ======================================
# STRIAE COMPLETE DEPLOYMENT SCRIPT
# ======================================
# This script deploys the entire Striae application:
# 1. Workers (all 6 workers)
# 2. Worker secrets/environment variables
# 3. Pages (frontend)
# 4. Pages secrets/environment variables

# Colors for output
$Red = "`e[91m"
$Green = "`e[92m"
$Yellow = "`e[93m"
$Blue = "`e[94m"
$Purple = "`e[95m"
$Reset = "`e[0m"

Write-Host "${Blue}🚀 Striae Complete Deployment Script${Reset}"
Write-Host "======================================"
Write-Host ""

# Step 1: Deploy Workers
Write-Host "${Purple}Step 1/4: Deploying Workers${Reset}"
Write-Host "----------------------------"
Write-Host "${Yellow}📦 Deploying all 6 Cloudflare Workers...${Reset}"
$workersResult = Start-Process -FilePath "npm" -ArgumentList "run", "deploy-workers" -Wait -PassThru -NoNewWindow
if ($workersResult.ExitCode -ne 0) {
    Write-Host "${Red}❌ Worker deployment failed!${Reset}"
    exit 1
}
Write-Host "${Green}✅ All workers deployed successfully${Reset}"
Write-Host ""

# Step 2: Deploy Worker Secrets
Write-Host "${Purple}Step 2/4: Deploying Worker Secrets${Reset}"
Write-Host "-----------------------------------"
Write-Host "${Yellow}🔐 Deploying worker environment variables...${Reset}"
$workerSecretsResult = Start-Process -FilePath "npm" -ArgumentList "run", "deploy-workers:secrets" -Wait -PassThru -NoNewWindow
if ($workerSecretsResult.ExitCode -ne 0) {
    Write-Host "${Red}❌ Worker secrets deployment failed!${Reset}"
    exit 1
}
Write-Host "${Green}✅ Worker secrets deployed successfully${Reset}"
Write-Host ""

# Step 3: Deploy Pages
Write-Host "${Purple}Step 3/4: Deploying Pages${Reset}"
Write-Host "--------------------------"
Write-Host "${Yellow}🌐 Building and deploying Pages...${Reset}"
$pagesResult = Start-Process -FilePath "npm" -ArgumentList "run", "deploy-pages" -Wait -PassThru -NoNewWindow
if ($pagesResult.ExitCode -ne 0) {
    Write-Host "${Red}❌ Pages deployment failed!${Reset}"
    exit 1
}
Write-Host "${Green}✅ Pages deployed successfully${Reset}"
Write-Host ""

# Step 4: Deploy Pages Secrets
Write-Host "${Purple}Step 4/4: Deploying Pages Secrets${Reset}"
Write-Host "----------------------------------"
Write-Host "${Yellow}🔑 Deploying Pages environment variables...${Reset}"
$pageSecretsResult = Start-Process -FilePath "npm" -ArgumentList "run", "deploy-pages:secrets" -Wait -PassThru -NoNewWindow
if ($pageSecretsResult.ExitCode -ne 0) {
    Write-Host "${Red}❌ Pages secrets deployment failed!${Reset}"
    exit 1
}
Write-Host "${Green}✅ Pages secrets deployed successfully${Reset}"
Write-Host ""

# Success summary
Write-Host "=========================================="
Write-Host "${Green}🎉 COMPLETE DEPLOYMENT SUCCESSFUL! 🎉${Reset}"
Write-Host "=========================================="
Write-Host ""
Write-Host "${Blue}Deployed Components:${Reset}"
Write-Host "  ✅ 6 Cloudflare Workers"
Write-Host "  ✅ Worker environment variables"
Write-Host "  ✅ Cloudflare Pages frontend"
Write-Host "  ✅ Pages environment variables"
Write-Host ""
Write-Host "${Blue}Next Steps:${Reset}"
Write-Host "  1. Test your application endpoints"
Write-Host "  2. Verify all services are working"
Write-Host "  3. Configure custom domain (optional)"
Write-Host ""
Write-Host "${Green}✨ Your Striae application is now fully deployed!${Reset}"
