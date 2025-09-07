# Striae Installation Guide

This guide provides step-by-step instructions for deploying Striae, a Firearms Examiner's Comparison Companion, on Cloudflare infrastructure.

## Table of Contents

1. [Prerequisites](#prerequisites)
   - [Required Accounts & Services](#required-accounts--services)
   - [Cloudflare Services Required](#cloudflare-services-required)
2. [Step 1: Clone and Prepare the Project](#step-1-clone-and-prepare-the-project)
   - [1.1: Extract Node Package Dependencies](#11-extract-node-package-dependencies)
3. [Step 2: Cloudflare Service Configuration](#step-2-cloudflare-service-configuration)
   - [2.1 Cloudflare Turnstile Setup](#21-cloudflare-turnstile-setup)
   - [2.2 Cloudflare Images Setup](#22-cloudflare-images-setup)
   - [2.3 Cloudflare KV Setup](#23-cloudflare-kv-setup)
   - [2.4 Cloudflare R2 Setup](#24-cloudflare-r2-setup)
4. [Step 3: Environment Variables Setup](#step-3-environment-variables-setup)
   - [3.1 Initialize Environment Configuration](#31-initialize-environment-configuration)
   - [3.2 Required Environment Variables](#32-required-environment-variables)
   - [3.3 Generate Security Tokens](#33-generate-security-tokens)
   - [3.4 Automated Environment Deployment](#34-automated-environment-deployment)
   - [3.5 Manual Pages Environment Variables](#35-manual-pages-environment-variables)
   - [3.6 Final Manual Steps](#36-final-manual-steps)
5. [Step 4: Configure Worker Files](#step-4-configure-worker-files)
   - [4.1 Copy Configuration Files](#41-copy-configuration-files)
   - [4.2 Update Worker Configurations](#42-update-worker-configurations)
6. [Step 5: Deploy Cloudflare Workers](#step-5-deploy-cloudflare-workers)
   - [5.1 Keys Worker](#51-keys-worker)
   - [5.2 User Worker](#52-user-worker)
   - [5.3 Data Worker](#53-data-worker)
   - [5.4 Images Worker](#54-images-worker)
   - [5.5 Turnstile Worker](#55-turnstile-worker)
   - [5.6 PDF Worker](#56-pdf-worker)
7. [Step 6: Configure CORS for All Workers](#step-6-configure-cors-for-all-workers)
   - [6.1 Update CORS Headers in Worker Source Files](#61-update-cors-headers-in-worker-source-files)
   - [6.2 Redeploy Workers After CORS Updates](#62-redeploy-workers-after-cors-updates)
   - [6.3 CORS Security Notes](#63-cors-security-notes)
   - [6.4 Verify CORS Configuration](#64-verify-cors-configuration)
8. [Step 7: Configuration Files](#step-7-configuration-files)
   - [7.1 Update Configuration Files](#71-update-configuration-files)
9. [Step 8: Deploy Frontend (Cloudflare Pages)](#step-8-deploy-frontend-cloudflare-pages)
   - [8.1 Build and Deploy](#81-build-and-deploy)
   - [8.2 Configure Pages Environment Variables](#82-configure-pages-environment-variables)
   - [8.3 Configure Custom Domain](#83-configure-custom-domain)
10. [Step 9: Testing and Verification](#step-9-testing-and-verification)
    - [9.1 Test Authentication Flow](#91-test-authentication-flow)
    - [9.2 Test Core Features](#92-test-core-features)
    - [9.3 Test Worker Endpoints](#93-test-worker-endpoints)
    - [9.4 Verify CORS Configuration](#94-verify-cors-configuration)
11. [Step 10: Security Checklist](#step-10-security-checklist)
12. [Important Notes & Updates](#important-notes--updates)
    - [✨ New Environment Setup System](#-new-environment-setup-system)
    - [Key Improvements Made](#key-improvements-made)
    - [Required Binding Names](#required-binding-names)
    - [Custom Domain Setup (Optional)](#custom-domain-setup-optional)
    - [Quick Start Summary](#quick-start-summary)
13. [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Useful Commands](#useful-commands)
14. [Support](#support)
15. [License](#license)
16. [Credits](#credits)

## Prerequisites

Before starting the installation, ensure you have the following accounts and services set up:

### Required Accounts & Services

1. **Firebase Project** with Authentication enabled and properly configured
2. **Cloudflare Account** with a registered domain name
3. **SendLayer Account** with API access
4. **Node.js** version 20.0.0 or higher
5. **Git** for cloning the repository

### Cloudflare Services Required

- **Cloudflare Pages** (for frontend hosting)
- **Cloudflare Workers** (for backend microservices)
- **Cloudflare Turnstile** (for bot protection)
- **Cloudflare Images** (for image storage and processing)
- **Cloudflare KV** (for user database)
- **Cloudflare R2** (for data storage)

---

## Step 1: Clone and Prepare the Project

```bash
git clone https://github.com/striae-org/striae.git
cd striae
```

### 1.1: Extract Node Package Dependencies

The repository includes a pre-configured node package that contains the exact dependencies required for Striae to function properly.

```bash
# Navigate to the node-package directory
cd node-package
```

**Windows (using 7-Zip):**
```cmd
# Using 7-Zip command line
7z x node-package.7z -o..

# Or extract manually using 7-Zip GUI:
# Right-click node-package.7z → 7-Zip → Extract to "..\\" → Extract
```

**Linux/macOS (requires p7zip):**
```bash
# Install p7zip if not already installed:
# Ubuntu/Debian: sudo apt-get install p7zip-full
# macOS: brew install p7zip
# CentOS/RHEL: sudo yum install p7zip

# Extract the 7z archive
7z x node-package.7z -o..
```

**Verification:**
```bash
# Navigate back to project root after extraction
cd ..

# Verify the extraction was successful
ls -la
# You should see: node_modules/, package.json, package-lock.json, postcss.config.js
```

> ⚠️ **Important**: This pre-configured node package is the only tested configuration that works with Striae. Do not run `npm install` or modify these dependencies unless absolutely necessary.

> 💡 **Note**: The node package contains all dependencies with the exact versions required for compatibility with Cloudflare Workers and the Remix framework used by Striae.


---

## Step 2: Cloudflare Service Configuration

### 2.1 Cloudflare Turnstile Setup

1. Navigate to Cloudflare Dashboard → Turnstile
2. Create a new Turnstile site
3. Configure the site settings:
   - **Domain**: Your domain (e.g., `striae.org`)
   - **Mode**: Managed or Non-Interactive (recommended)
4. Note down:
   - **Site Key** (for frontend configuration)
   - **Secret Key** (CFT_SECRET_KEY)

### 2.2 Cloudflare Images Setup

1. Navigate to Cloudflare Dashboard → Images
2. Subscribe to the Cloudflare Images plan
3. Go to Images → Variants and create a new variant:
   - **Variant Name**: `striae`
   - **Settings**: Use default settings
   - **Metadata**: Strip all metadata (recommended)
4. Go to Images → Keys and note:
   - **HMAC Key** for signed URLs (HMAC_KEY)
5. Go to Images → Overview and note:
   - **Account ID** (ACCOUNT_ID)
   - **Account Hash** (ACCOUNT_HASH)
6. Go to Manage Account → Account API Tokens and create:
   - **Images API Token** with read and write permissions to Cloudflare Images (IMAGES_API_TOKEN: Keys Worker; API_TOKEN: Images Worker)

### 2.3 Cloudflare KV Setup

1. Navigate to Cloudflare Dashboard → Storage & Databases → KV
2. Create a new KV namespace named `user-db` (or your preferred name)
3. Note down the KV namespace ID

### 2.4 Cloudflare R2 Setup

1. Navigate to Cloudflare Dashboard → R2 Object Storage
2. Create a new R2 bucket for data storage
3. Configure CORS settings for your bucket, replacing the allowed origin with your custom domain:

```json
[
  {
    "AllowedOrigins": [
      "https://your-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "DELETE",
      "POST"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "Content-Type",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Step 3: Environment Variables Setup

Striae uses a centralized environment variables system that organizes all secrets by their usage across different workers and the Pages application.

### 3.1 Initialize Environment Configuration

1. **Copy the environment template:**

```bash
cp .env.example .env
```

2. **Fill in your actual values in the `.env` file**

The `.env` file is organized by service and includes:
- **Pages Worker Variables**: Session management and email service
- **Keys Worker Variables**: Authentication and key management  
- **Individual Worker Variables**: Service-specific secrets
- **Cloudflare Service Keys**: Images, Turnstile, R2, KV credentials

### 3.2 Required Environment Variables

All required variables are documented in the `.env` file. Here's what you need to collect:

**Cloudflare Services:**
- `ACCOUNT_ID` - Your Cloudflare Account ID
- `IMAGES_API_TOKEN` - Cloudflare Images API token
- `ACCOUNT_HASH` - Cloudflare Images Account Hash
- `HMAC_KEY` - Cloudflare Images HMAC signing key
- `CFT_SECRET_KEY` - Cloudflare Turnstile secret key

**External Services:**
- `SL_API_KEY` - SendLayer API token

**Custom Security Tokens** (generate your own):
- `R2_KEY_SECRET` - R2 authentication token
- `USER_DB_AUTH` - KV authentication token
- `KEYS_AUTH` - Key handler authentication token
- `AUTH_PASSWORD` - Registration password

### 3.3 Generate Security Tokens

Generate secure random tokens for the custom authentication variables:

```bash
# Session secret (64 characters recommended)
openssl rand -hex 32

# Custom auth tokens (32 characters)
openssl rand -hex 16

# Alternative format
openssl rand -base64 24
```

### 3.4 Automated Environment Deployment

Once your `.env` file is configured, use the automated deployment scripts:

**Linux/macOS/WSL:**
```bash
./scripts/deploy-env.sh
```

**Windows PowerShell:**
```powershell
.\scripts\deploy-env.ps1
```

**Windows Command Prompt:**
```cmd
scripts\deploy-env.bat
```

The scripts will:
- ✅ Validate all required variables are set
- ✅ Deploy secrets to each worker automatically  
- ✅ Provide clear progress feedback
- ✅ Show remaining manual steps

### 3.5 Manual Pages Environment Variables

After running the deployment script, manually set these variables in the **Cloudflare Pages Dashboard**:
- `SL_API_KEY`
- `AUTH_PASSWORD`

### 3.6 Final Manual Steps

1. **Configure KV Namespace**: Update the namespace ID in `workers/user-worker/wrangler.jsonc`
2. **Configure R2 Bucket**: Update the bucket name in `workers/data-worker/wrangler.jsonc`

> 📚 **Detailed Documentation**: See [Environment Variables Setup](https://developers.striae.org/striae-dev/get-started/installation-guide/environment-variables-setup) for comprehensive environment setup documentation, troubleshooting, and manual configuration options.

---

## Step 4: Configure Worker Files

Before deploying workers, you need to configure each worker's `wrangler.jsonc` file:

### 4.1 Copy Configuration Files

For each worker, copy the example configuration:

```bash
# Navigate to each worker directory and copy the example file
cd workers/keys-worker
cp wrangler.jsonc.example wrangler.jsonc

cd ../user-worker  
cp wrangler.jsonc.example wrangler.jsonc

cd ../data-worker
cp wrangler.jsonc.example wrangler.jsonc

cd ../image-worker
cp wrangler.jsonc.example wrangler.jsonc

cd ../turnstile-worker
cp wrangler.jsonc.example wrangler.jsonc

cd ../pdf-worker
cp wrangler.jsonc.example wrangler.jsonc
```

### 4.2 Update Worker Configurations

In each `wrangler.jsonc` file, update the following:

1. **Replace `YOUR_ACCOUNT_ID`** with your actual Cloudflare Account ID
2. **Replace custom domain patterns** with your actual domains (optional but recommended)
3. **Update KV namespace ID** in user-worker (replace `USER_DB` with actual namespace ID)
4. **Update R2 bucket name** in data-worker (replace `striae-data` with your bucket name)

**Example for user-worker/wrangler.jsonc:**
```json
{
  "name": "striae-users",
  "account_id": "your-actual-account-id",
  "main": "src/user-worker.js",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "kv_namespaces": [
    {
      "binding": "USER_DB",
      "id": "your-actual-kv-namespace-id"
    }
  ],
  "routes": [
    {
      "pattern": "users.yourdomain.com",
      "custom_domain": true
    }
  ],
  "placement": { "mode": "smart" }
}
```

**Example for data-worker/wrangler.jsonc:**
```json
{
  "name": "striae-data",
  "account_id": "your-actual-account-id",
  "main": "src/data-worker.js",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "r2_buckets": [
    {
      "binding": "STRIAE_DATA",
      "bucket_name": "your-actual-r2-bucket-name"
    }
  ],
  "routes": [
    {
      "pattern": "data.yourdomain.com",
      "custom_domain": true
    }
  ],
  "placement": { "mode": "smart" }
}
```

---

## Step 5: Deploy Cloudflare Workers

**Note:** If you completed Step 3.4 (Automated Environment Deployment), the environment variables are already set and you can skip directly to deploying the workers. The automated scripts handle all the secret configuration.

Deploy each worker in the following order:

### 5.1 Keys Worker

```bash
cd workers/keys-worker
npm install
wrangler deploy
```

**Environment variables:** ✅ Already configured if you used the automated deployment scripts (Step 3.4)

**Manual configuration** (if not using automated scripts):
- `ACCOUNT_HASH`: Your Images Account Hash
- `AUTH_PASSWORD`: Your custom auth password
- `IMAGES_API_TOKEN`: Your Images API token
- `KEYS_AUTH`: Your custom keys auth token
- `R2_KEY_SECRET`: Your custom R2 secret
- `USER_DB_AUTH`: Your custom user DB auth token

### 5.2 User Worker

```bash
cd ../user-worker
npm install
wrangler deploy
```

**Environment variables:** ✅ Already configured if you used the automated deployment scripts (Step 3.4)

1. KV binding is configured in `wrangler.jsonc`:
   - Binding name: `USER_DB`
   - KV namespace ID: Set in your wrangler.jsonc file

**Manual configuration** (if not using automated scripts):
- `USER_DB_AUTH`: Your custom user DB auth token

### 5.3 Data Worker

```bash
cd ../data-worker
npm install
wrangler deploy
```

**Environment variables:** ✅ Already configured if you used the automated deployment scripts (Step 3.4)

1. R2 binding is configured in `wrangler.jsonc`:
   - Binding name: `STRIAE_DATA`
   - Bucket name: Set in your wrangler.jsonc file

**Manual configuration** (if not using automated scripts):
- `R2_KEY_SECRET`: Your custom R2 secret

### 5.4 Images Worker

```bash
cd ../image-worker
npm install
wrangler deploy
```

**Environment variables:** ✅ Already configured if you used the automated deployment scripts (Step 3.4)

**Manual configuration** (if not using automated scripts):
- `ACCOUNT_ID`: Your Cloudflare Account ID
- `API_TOKEN`: Your Images API token
- `HMAC_KEY`: Your Images HMAC signing key

### 5.5 Turnstile Worker

```bash
cd ../turnstile-worker
npm install
wrangler deploy
```

**Environment variables:** ✅ Already configured if you used the automated deployment scripts (Step 3.4)

**Manual configuration** (if not using automated scripts):
- `CFT_SECRET_KEY`: Your Cloudflare Turnstile secret key

### 5.6 PDF Worker

```bash
cd ../pdf-worker
npm install
wrangler deploy
```

**Environment variables:** ✅ No environment variables needed (uses browser binding only)

---

## Step 6: Configure CORS for All Workers

**Important**: All workers have CORS (Cross-Origin Resource Sharing) headers that must be updated to match your domain. By default, they're configured for `https://www.striae.org`.

### 6.1 Update CORS Headers in Worker Source Files

Each worker needs its CORS headers updated to allow requests from your domain:

**1. User Worker** (`workers/user-worker/src/user-worker.js`):
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-domain.com', // Update this
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Custom-Auth-Key',
  'Content-Type': 'application/json'
};
```

**2. Data Worker** (`workers/data-worker/src/data-worker.js`):
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-domain.com', // Update this
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Custom-Auth-Key',
  'Content-Type': 'application/json'
};
```

**3. Images Worker** (`workers/image-worker/src/image-worker.js`):
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-domain.com', // Update this
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Custom-Auth-Key',
  'Content-Type': 'application/json'
};
```

**4. Keys Worker** (`workers/keys-worker/src/keys.js`):
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-domain.com', // Update this
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Custom-Auth-Key',
  'Content-Type': 'text/plain'
};
```

**5. Turnstile Worker** (`workers/turnstile-worker/src/turnstile.js`):
```javascript
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://your-domain.com', // Update this
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type'
};
```

**6. PDF Worker** (`workers/pdf-worker/src/pdf-worker.js`):
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-domain.com', // Update this
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};
```

### 6.2 Redeploy Workers After CORS Updates

After updating CORS headers, redeploy each worker:

```bash
# Redeploy all workers with updated CORS
cd workers/user-worker && wrangler deploy && cd ../..
cd workers/data-worker && wrangler deploy && cd ../..
cd workers/image-worker && wrangler deploy && cd ../..
cd workers/keys-worker && wrangler deploy && cd ../..
cd workers/turnstile-worker && wrangler deploy && cd ../..
cd workers/pdf-worker && wrangler deploy && cd ../..
```

Or use a batch script:
```bash
for worker in user-worker data-worker image-worker keys-worker turnstile-worker pdf-worker; do
  echo "Deploying $worker..."
  cd "workers/$worker"
  wrangler deploy
  cd "../.."
done
```

### 6.3 CORS Security Notes

- **Use HTTPS**: Always use `https://` in CORS origins
- **Exact Match**: CORS requires exact domain matching (including subdomains)
- **No Wildcards**: Avoid using `*` for Access-Control-Allow-Origin in production
- **Multiple Domains**: If you need multiple domains, implement dynamic CORS checking
- **Testing**: Use browser developer tools to verify CORS headers are correct

### 6.4 Verify CORS Configuration

Test CORS headers using curl or browser developer tools:

```bash
# Test CORS preflight request
curl -X OPTIONS \
  -H "Origin: https://your-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://your-worker.your-subdomain.workers.dev

# Should return Access-Control-Allow-Origin header
```

**Common CORS Issues:**
- ❌ **Mixed HTTP/HTTPS**: Ensure both frontend and workers use HTTPS
- ❌ **Subdomain Mismatch**: `www.domain.com` ≠ `domain.com`
- ❌ **Port Differences**: Development vs production port differences
- ❌ **Missing Preflight**: Some requests require OPTIONS preflight handling

---

## Step 7: Configuration Files

### 7.1 Update Configuration Files

1. **Copy example configurations**:
```bash
cp app/config-example/config.json app/config/config.json
cp app/config-example/firebase.ts app/config/firebase.ts
cp app/config-example/inactivity.ts app/config/inactivity.ts
```

2. **Update `app/config/config.json`**:
Replace all worker URLs with your deployed worker URLs:
```json
{
  "name": "Striae",
  "author": "Stephen J. Lu",
  "title": "A Firearms Examiner's Comparison Companion",  
  "url": "https://your-domain.com",    
  "data_worker_url": "https://your-data-worker.your-subdomain.workers.dev",
  "keys_url": "https://your-keys-worker.your-subdomain.workers.dev",
  "image_worker_url": "https://your-image-worker.your-subdomain.workers.dev",
  "user_worker_url": "https://your-user-worker.your-subdomain.workers.dev",
  "pdf_worker_url": "https://your-pdf-worker.your-subdomain.workers.dev",
  "keys_auth": "YOUR_KEYS_AUTH_TOKEN"
}
```

3. **Update `app/components/turnstile/keys.json`**:
```json
{
  "CFT_PUBLIC_KEY": "YOUR_CLOUDFLARE_TURNSTILE_PUBLIC_KEY",
  "worker_url": "https://your-turnstile-worker.your-subdomain.workers.dev"
}
```

4. **Update `app/config/firebase.ts`**:
Insert your Firebase configuration parameters:
```typescript
// Replace with your Firebase config
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

5. **Update `wrangler.toml`**:
```toml
name = "your-striae-app-name"
compatibility_date = "2024-12-30"
pages_build_output_dir = "./build/client"

[placement]
mode = "smart"
```

---

## Step 8: Deploy Frontend (Cloudflare Pages)

### 8.1 Build and Deploy

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

### 8.2 Configure Pages Environment Variables

**Note:** If you used the automated deployment scripts in Step 3.4, you still need to manually set these variables in the Cloudflare Pages Dashboard:

- `AUTH_PASSWORD`: Your custom registration password
- `SL_API_KEY`: Your SendLayer API key

### 8.3 Configure Custom Domain

1. Go to Cloudflare Pages → Your project → Custom domains
2. Add your custom domain
3. Configure DNS records as instructed

---

## Step 9: Testing and Verification

### 9.1 Test Authentication Flow

1. Navigate to your deployed application
2. Test user registration
3. Test user login
4. Test multi-factor authentication (MFA)
5. Test password reset functionality

### 9.2 Test Core Features

1. **Image Upload**: Test image upload functionality
2. **Data Storage**: Test data saving and retrieval
3. **PDF Generation**: Test PDF export features
4. **Turnstile**: Verify bot protection is working

### 9.3 Test Worker Endpoints

Verify each worker is responding correctly:
- Keys worker: Authentication and key management
- User worker: User data operations
- Data worker: Data storage operations
- Images worker: Image upload and processing
- Turnstile worker: Bot protection
- PDF worker: PDF generation

### 9.4 Verify CORS Configuration

Test that CORS is working correctly by:

1. **Browser Developer Tools**: Check that requests from your frontend to workers succeed without CORS errors
2. **Network Tab**: Verify that OPTIONS preflight requests return proper CORS headers
3. **Manual Testing**: Use curl to test CORS headers:

```bash
# Test CORS for each worker
curl -X OPTIONS \
  -H "Origin: https://your-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  https://your-worker-url.workers.dev
```

Expected response should include:
- `Access-Control-Allow-Origin: https://your-domain.com`
- Appropriate `Access-Control-Allow-Methods`
- Appropriate `Access-Control-Allow-Headers`

---

## Step 10: Security Checklist

- [ ] All environment variables are set correctly
- [ ] CORS is properly configured for all workers with your domain
- [ ] CORS is properly configured for R2
- [ ] Firebase authentication is working
- [ ] Turnstile is blocking bots
- [ ] HTTPS is enforced
- [ ] All custom domains are configured
- [ ] Worker authentication tokens are unique and secure

---

## Important Notes & Updates

### ✨ New Environment Setup System

**Striae now includes an automated environment variables management system:**

1. **Centralized Configuration**: All environment variables organized in `.env` file by service
2. **Automated Environment Setup**: Scripts for Linux, macOS, Windows, and PowerShell
3. **Template System**: Safe `.env.example` file for version control
4. **Comprehensive Documentation**: See [Environment Variables Setup](https://developers.striae.org/striae-dev/get-started/installation-guide/environment-variables-setup) for detailed instructions

### Key Improvements Made

1. **Streamlined Environment Setup**: Single `.env` file replaces manual variable collection
2. **Automated Secret Management**: One command configures all worker secrets
3. **Cross-Platform Support**: Scripts for all operating systems
4. **Better Organization**: Variables grouped by worker/service usage
5. **Enhanced Security**: Template system prevents accidental credential commits

### Required Binding Names
- **User Worker KV Binding**: `USER_DB`
- **Data Worker R2 Binding**: `STRIAE_DATA`

### Custom Domain Setup (Optional)
Each worker can optionally use custom domains. Update the `routes` section in each worker's `wrangler.jsonc` file with your preferred subdomain pattern:
- Keys: `keys.yourdomain.com`
- Users: `users.yourdomain.com`  
- Data: `data.yourdomain.com`
- Images: `images.yourdomain.com`
- Turnstile: `turnstile.yourdomain.com`
- PDF: `pdf.yourdomain.com`

### Quick Start Summary

1. **Setup Environment**: `cp .env.example .env` → Fill values → `./scripts/deploy-env.sh`
2. **Configure Workers**: Copy `wrangler.jsonc.example` files and update settings
3. **Deploy Workers**: `npm install && wrangler deploy` for each worker
4. **Configure App**: Update config files with worker URLs
5. **Deploy Frontend**: `npm run deploy` and set Pages environment variables

---

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure R2 CORS configuration includes your domain
2. **Authentication Failures**: Verify Firebase configuration and worker tokens
3. **Image Upload Issues**: Check environment variable configuration in image worker
4. **Worker Errors**: Verify environment variables and bindings are set correctly

### Useful Commands

```bash
# Check worker status
wrangler whoami

# Tail worker logs
wrangler tail [worker-name]

# Check Pages deployment status
wrangler pages deployment list

# Test local development
npm run dev
```

---

## Support

For support and questions:
- **Documentation**: [Striae Documentation](https://developers.striae.org/striae-dev/get-started/document-index)
- **Support Portal**: [Striae Support](https://www.striae.org/support)
- **Discord**: [Striae on Discord](https://discord.gg/ESUPhTPwHx)

---

## License

This project is licensed under the terms specified in the LICENSE file.

---

## Credits

This project was entirely designed and developed by [Stephen J. Lu](https://www.stephenjlu.com)

---
