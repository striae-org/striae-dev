# ================================
# STRIAE ENVIRONMENT SETUP SCRIPT (PowerShell)
# ================================
# This script helps deploy environment variables to all Cloudflare Workers
# Make sure you have wrangler CLI installed and authenticated

param(
    [switch]$WhatIf,
    [switch]$Help
)

if ($Help) {
    Write-Host "🚀 Striae Environment Variables Deployment Script" -ForegroundColor Blue
    Write-Host "=================================================="
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\deploy-env.ps1           # Deploy all environment variables"
    Write-Host "  .\deploy-env.ps1 -WhatIf   # Show what would be deployed without actually doing it"
    Write-Host "  .\deploy-env.ps1 -Help     # Show this help message"
    Write-Host ""
    Write-Host "Prerequisites:"
    Write-Host "  - wrangler CLI installed and authenticated"
    Write-Host "  - .env file with all required variables"
    exit 0
}

Write-Host "🚀 Striae Environment Variables Deployment Script" -ForegroundColor Blue
Write-Host "=================================================="

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and fill in your values."
    exit 1
}

# Load environment variables from .env file
Write-Host "📖 Loading environment variables from .env..." -ForegroundColor Yellow

$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^([^#][^=]*?)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        if ($name -and $value -and $value -ne "your_*_here") {
            $envVars[$name] = $value
        }
    }
}

# Validate required variables
$requiredVars = @(
    "ACCOUNT_ID",
    "SL_API_KEY",
    "AUTH_PASSWORD",
    "KEYS_AUTH",
    "USER_DB_AUTH",
    "R2_KEY_SECRET",
    "ACCOUNT_HASH",
    "IMAGES_API_TOKEN",
    "API_TOKEN",
    "CFT_SECRET_KEY",
    "HMAC_KEY"
)

Write-Host "🔍 Validating required environment variables..." -ForegroundColor Yellow
$missingVars = @()
foreach ($var in $requiredVars) {
    if (-not $envVars.ContainsKey($var) -or -not $envVars[$var]) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Error: Missing required variables:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "✅ All required variables found" -ForegroundColor Green

# Function to set worker secrets
function Set-WorkerSecrets {
    param(
        [string]$WorkerName,
        [string]$WorkerPath,
        [string[]]$Secrets
    )
    
    Write-Host ""
    Write-Host "🔧 Setting secrets for $WorkerName..." -ForegroundColor Blue
    
    Push-Location $WorkerPath
    $workerConfigName = (Get-Item .).Name
    
    foreach ($secret in $Secrets) {
        if ($envVars.ContainsKey($secret)) {
            Write-Host "  Setting $secret..." -ForegroundColor Yellow
            if ($WhatIf) {
                Write-Host "    [WhatIf] Would run: echo '***' | wrangler secret put $secret --name $workerConfigName" -ForegroundColor Gray
            } else {
                try {
                    $envVars[$secret] | wrangler secret put $secret --name $workerConfigName
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "    ✅ $secret set successfully" -ForegroundColor Green
                    } else {
                        Write-Host "    ❌ Failed to set $secret" -ForegroundColor Red
                    }
                } catch {
                    Write-Host "    ❌ Error setting $secret : $_" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "    ⚠️ $secret not found in .env" -ForegroundColor Yellow
        }
    }
    
    Pop-Location
    Write-Host "✅ $WorkerName secrets configured" -ForegroundColor Green
}

# Deploy secrets to each worker
Write-Host ""
Write-Host "🔐 Deploying secrets to workers..." -ForegroundColor Blue

if ($WhatIf) {
    Write-Host "🔍 WhatIf mode: Showing what would be deployed..." -ForegroundColor Cyan
}

# Keys Worker
Set-WorkerSecrets -WorkerName "Keys Worker" -WorkerPath "workers/keys-worker" -Secrets @(
    "KEYS_AUTH", "USER_DB_AUTH", "R2_KEY_SECRET", "ACCOUNT_HASH", "IMAGES_API_TOKEN", "AUTH_PASSWORD"
)

# User Worker  
Set-WorkerSecrets -WorkerName "User Worker" -WorkerPath "workers/user-worker" -Secrets @(
    "USER_DB_AUTH"
)

# Data Worker
Set-WorkerSecrets -WorkerName "Data Worker" -WorkerPath "workers/data-worker" -Secrets @(
    "R2_KEY_SECRET"
)

# Images Worker
Set-WorkerSecrets -WorkerName "Images Worker" -WorkerPath "workers/image-worker" -Secrets @(
    "ACCOUNT_ID", "API_TOKEN", "HMAC_KEY"
)

# Turnstile Worker
Set-WorkerSecrets -WorkerName "Turnstile Worker" -WorkerPath "workers/turnstile-worker" -Secrets @(
    "CFT_SECRET_KEY"
)

# PDF Worker (no secrets needed)
Write-Host ""
Write-Host "📄 PDF Worker: No environment variables needed" -ForegroundColor Blue

if (-not $WhatIf) {
    Write-Host ""
    Write-Host "🎉 All worker secrets deployed successfully!" -ForegroundColor Green
}

# Remind about Pages environment variables
Write-Host ""
Write-Host "⚠️  IMPORTANT: Don't forget to set these variables in Cloudflare Pages Dashboard:" -ForegroundColor Yellow
Write-Host "   - SL_API_KEY" -ForegroundColor White
Write-Host "   - AUTH_PASSWORD" -ForegroundColor White

Write-Host ""
Write-Host "⚠️  ALSO REMEMBER TO:" -ForegroundColor Yellow
Write-Host "   - Configure KV namespace ID in workers/user-worker/wrangler.jsonc" -ForegroundColor White
Write-Host "   - Configure R2 bucket name in workers/data-worker/wrangler.jsonc" -ForegroundColor White

Write-Host ""
Write-Host "📝 For manual deployment, use these commands:" -ForegroundColor Blue
Write-Host "   wrangler secret put VARIABLE_NAME --name worker-name" -ForegroundColor White

Write-Host ""
Write-Host "✨ Environment setup complete!" -ForegroundColor Green
