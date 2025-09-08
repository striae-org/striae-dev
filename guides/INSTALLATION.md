# Striae Installation Guide

This guide provides step-by-step instructions for deploying Striae, a Firearms Examiner's Comparison Companion, on Cloudflare infrastructure.

> **👥 Internal Developers**: If you are an internal developer with the striae-org team, you can skip most of the setup process! See the [Internal Developer Quick Start](#internal-developer-quick-start) section below.

## Table of Contents

1. [Prerequisites](#prerequisites)
   - [External Developers - Required Accounts & Services](#external-developers---required-accounts--services)
   - [Cloudflare Services Required](#cloudflare-services-required)
   - [Internal Developer Quick Start](#internal-developer-quick-start)
2. [Step 1: Clone and Prepare the Project](#step-1-clone-and-prepare-the-project)
   - [1.1: Extract Node Package Dependencies](#11-extract-node-package-dependencies)
3. [Step 2: Cloudflare Service Configuration](#step-2-cloudflare-service-configuration)
   - [2.1 Cloudflare Turnstile Setup](#21-cloudflare-turnstile-setup)
   - [2.2 Cloudflare Images Setup](#22-cloudflare-images-setup)
   - [2.3 Cloudflare KV Setup](#23-cloudflare-kv-setup)
   - [2.4 Cloudflare R2 Setup](#24-cloudflare-r2-setup)
4. [Step 3: Configure Worker Files](#step-3-configure-worker-files)
   - [3.1 Copy Configuration Files](#31-copy-configuration-files)
   - [3.2 Update Worker Configurations](#32-update-worker-configurations)
5. [Step 4: Configure CORS for All Workers](#step-4-configure-cors-for-all-workers)
   - [4.1 Update CORS Headers in Worker Source Files](#41-update-cors-headers-in-worker-source-files)
   - [4.2 CORS Security Notes](#42-cors-security-notes)
   - [4.3 Verify CORS Configuration](#43-verify-cors-configuration)
6. [Step 5: Deploy Cloudflare Workers](#step-5-deploy-cloudflare-workers)
   - [5.1 Keys Worker](#51-keys-worker)
   - [5.2 User Worker](#52-user-worker)
   - [5.3 Data Worker](#53-data-worker)
   - [5.4 Images Worker](#54-images-worker)
   - [5.5 Turnstile Worker](#55-turnstile-worker)
   - [5.6 PDF Worker](#56-pdf-worker)
7. [Step 6: Environment Variables Setup](#step-6-environment-variables-setup)
   - [6.1 Initialize Environment Configuration](#61-initialize-environment-configuration)
   - [6.2 Required Environment Variables](#62-required-environment-variables)
   - [6.3 Generate Security Tokens](#63-generate-security-tokens)
   - [6.4 Automated Environment Deployment](#64-automated-environment-deployment)
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
    - [KV Namespace Configuration Issues](#kv-namespace-configuration-issues)
    - [Useful Commands](#useful-commands)

## Prerequisites

Before starting the installation, choose your setup path based on your developer status:

### External Developers - Required Accounts & Services

**If you are setting up Striae independently**, you'll need to configure all services yourself:

1. **Cloudflare Account** with a registered domain name (for all Cloudflare services)
2. **Firebase Project** with Authentication enabled and properly configured
3. **SendLayer Account** with API access for email services
4. **Node.js** version 20.0.0 or higher
5. **Git** for cloning the repository

### Cloudflare Services Required

- **Cloudflare Pages** (for frontend hosting)
- **Cloudflare Workers** (for backend microservices)
- **Cloudflare Turnstile** (for bot protection)
- **Cloudflare Images** (for image storage and processing)
- **Cloudflare KV** (for user database)
- **Cloudflare R2** (for data storage)

### Internal Developer Quick Start

**If you are an internal developer with the striae-org team**, you have a much simpler setup process:

#### ✅ Already Set Up for You:
- **Cloudflare Account & Services** - Access provided through shared developer account (Pages, Workers, KV, R2, Images, Turnstile)
- **Firebase Authentication & MFA** - Pre-configured and ready to use
- **SendLayer API** - Email services already configured  
- **Environment Variables** - Complete `.env` file provided
- **Configuration Files** - All `config.json`, `firebase.ts`, and worker configs ready
- **Development Access** - Access to [https://dev.striae.org](https://dev.striae.org) for testing

#### 📋 Your Requirements:
1. **Node.js** version 20.0.0 or higher
2. **Git** access to contribute to `striae-org/striae-dev` fork
3. **Development on separate branches only** - All contributions must be on dev branches, never directly to main/master

#### 🚀 Quick Setup Process:
1. **Clone the dev fork**: `git clone https://github.com/striae-org/striae-dev.git`
2. **Create your dev branch**: `git checkout -b your-feature-branch`
3. **Use provided files**: Copy the complete `.env` and config files you receive
4. **Extract dependencies**: Follow Step 1.1 to extract the node package
5. **Deploy workers**: Skip configuration steps, go directly to worker deployment
6. **Start developing**: You're ready to contribute!

#### 📞 Getting Internal Developer Access:
Contact Stephen at [dev@striae.org](mailto:dev@striae.org) to:
- Receive your pre-configured environment files
- Get access to the shared Cloudflare developer account
- Get access to the development fork
- Join the internal development workflow

> **🔒 Development Workflow**: All internal development must be contributed to the `striae-org/striae-dev` fork on separate dev branches only. Direct commits to main/master branches are not permitted.

---

## Step 1: Clone and Prepare the Project

**For External Developers:**
1. **Fork the repository** to your GitHub account:
   - Go to [https://github.com/striae-org/striae](https://github.com/striae-org/striae)
   - Click the "Fork" button to create your own copy
2. **Clone your fork**:
```bash
git clone https://github.com/YOUR_USERNAME/striae.git
cd striae
```

**For Internal Developers:**
```bash
# Clone the development fork directly (you have push access)
git clone https://github.com/striae-org/striae-dev.git
cd striae-dev

# Create your feature branch immediately
git checkout -b your-feature-branch-name
```

> **🔒 External Developer Note**: After forking and making changes, you'll submit pull requests from your fork back to the main `striae-org/striae` repository.

> **🔒 Internal Developer Note**: All development must be done on separate dev branches within the `striae-org/striae-dev` fork. Never commit directly to main/master branches.

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

**🎯 Internal Developers**: **Skip this entire step**. You have access to pre-configured Cloudflare services through the shared developer account. All Turnstile, Images, KV, and R2 services are already set up and configured.

**📋 External Developers**: This section guides you through setting up your own Cloudflare services required for Striae.

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
2. Click "+ Create Instance" in the upper right corner
3. Create a new KV namespace:
   - **Namespace name**: `USER_DB` (or your preferred name)
   - Click "Create"

4. **⚠️ IMPORTANT: Record the Namespace ID**
   - After creating the namespace, you'll see it listed in the KV dashboard
   - **Copy the "Namespace ID"** (UUID format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Save this ID** - you'll need it for Step 3 (Configure Worker Files)
   - Example: `680e629649f957baa393b83d11ca17c6`

> **Important Note:** The Namespace ID is different from the namespace name. You need the UUID-format ID, not the name "USER_DB". This ID will be used in your worker configuration files.

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

## Step 3: Configure Worker Files

**🎯 Internal Developers**: **Skip this entire step**. You will receive pre-configured `wrangler.jsonc` files for all workers with the correct account IDs, namespace IDs, and bucket names already set up.

**📋 External Developers**: Before deploying workers, you need to configure each worker's `wrangler.jsonc` file with your own Cloudflare account details.

Before deploying workers, you need to configure each worker's `wrangler.jsonc` file:

### 3.1 Copy Configuration Files

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

### 3.2 Update Worker Configurations

In each `wrangler.jsonc` file, update the following:

1. **Replace `YOUR_ACCOUNT_ID`** with your actual Cloudflare Account ID
2. **Replace custom domain patterns** with your actual domains (optional but recommended)
3. **🔑 Update KV namespace ID** in user-worker:
   - Open `workers/user-worker/wrangler.jsonc`
   - Find the `kv_namespaces` section
   - Replace `insert-your-kv-namespace-id` with the **Namespace ID** you saved from Step 2.3
   - Example: `"id": "680e629649f957baa393b83d11ca17c6"`
4. **Update R2 bucket name** in data-worker (replace `insert-your-r2-bucket-name` with your bucket name)

> **KV Namespace Configuration Example:**
> ```json
> "kv_namespaces": [
>   {
>     "binding": "USER_DB",
>     "id": "680e629649f957baa393b83d11ca17c6"
>   }
> ]
> ```
> ⚠️ Use the UUID-format **Namespace ID**, not the namespace name!

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

## Step 4: Configure CORS for All Workers

**🎯 Internal Developers**: **Skip this entire step**. CORS headers are already configured for the development environment (`https://dev.striae.org`) in the provided worker files.

**📋 External Developers**: All workers have CORS (Cross-Origin Resource Sharing) headers that must be updated to match your domain.

**Important**: All workers have CORS (Cross-Origin Resource Sharing) headers that must be updated to match your domain. By default, they're configured for `https://www.striae.org`.

### 4.1 Update CORS Headers in Worker Source Files

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

### 4.2 CORS Security Notes

- **Use HTTPS**: Always use `https://` in CORS origins
- **Exact Match**: CORS requires exact domain matching (including subdomains)
- **No Wildcards**: Avoid using `*` for Access-Control-Allow-Origin in production
- **Multiple Domains**: If you need multiple domains, implement dynamic CORS checking
- **Testing**: Use browser developer tools to verify CORS headers are correct

### 4.3 Verify CORS Configuration

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

## Step 5: Deploy Cloudflare Workers

**✅ Prerequisites**: Before deploying workers, ensure you have:
1. ✅ Configured all worker files (`wrangler.jsonc`) in Step 3
2. ✅ Updated CORS settings in worker source files in Step 4

Deploy each worker to make them available for environment variable setup in Step 6.

Deploy each worker in the following order:

### 5.1 Keys Worker

```bash
cd workers/keys-worker
npm install
wrangler deploy
```

**Manual configuration reference** (environment variables will be set up in Step 6):
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

1. KV binding is configured in `wrangler.jsonc`:
   - Binding name: `USER_DB`
   - KV namespace ID: Set in your wrangler.jsonc file

**Manual configuration reference** (environment variables will be set up in Step 6):
- `USER_DB_AUTH`: Your custom user DB auth token

### 5.3 Data Worker

```bash
cd ../data-worker
npm install
wrangler deploy
```

1. R2 binding is configured in `wrangler.jsonc`:
   - Binding name: `STRIAE_DATA`
   - Bucket name: Set in your wrangler.jsonc file

**Manual configuration reference** (environment variables will be set up in Step 6):
- `R2_KEY_SECRET`: Your custom R2 secret

### 5.4 Images Worker

```bash
cd ../image-worker
npm install
wrangler deploy
```

**Manual configuration reference** (environment variables will be set up in Step 6):
- `ACCOUNT_ID`: Your Cloudflare Account ID
- `API_TOKEN`: Your Images API token
- `HMAC_KEY`: Your Images HMAC signing key

### 5.5 Turnstile Worker

```bash
cd ../turnstile-worker
npm install
wrangler deploy
```

**Manual configuration reference** (environment variables will be set up in Step 6):
- `CFT_SECRET_KEY`: Your Cloudflare Turnstile secret key

### 5.6 PDF Worker

```bash
cd ../pdf-worker
npm install
wrangler deploy
```

**Environment variables:** ✅ No environment variables needed (uses browser binding only)

---

## Step 6: Environment Variables Setup

**⚠️ Important**: This step should be done AFTER configuring worker files (Step 3) and CORS settings (Step 4), and AFTER deploying workers (Step 5). The deployment scripts now require properly configured worker files to function correctly.

**🎯 Internal Developers**: If you are an internal developer, **skip this entire step**. You will receive a complete, pre-configured `.env` file with all required variables. Simply use the provided file and proceed to Step 7.

**📋 External Developers**: This section is for external developers who need to set up their own environment variables and external service accounts.

Striae uses a centralized environment variables system that organizes all secrets by their usage across different workers and the Pages application.

### 6.1 Initialize Environment Configuration

**For Standard Installation:**

1. **Copy the environment template:**

```bash
cp .env.example .env
```

**For Internal Developers:**

1. **Use the provided `.env` file** (received from the development team)
2. **Skip to Step 6.4** (Automated Environment Deployment)
```

2. **Fill in your actual values in the `.env` file**

The `.env` file is organized by service and includes:
- **Pages Worker Variables**: Session management and email service
- **Keys Worker Variables**: Authentication and key management  
- **Individual Worker Variables**: Service-specific secrets
- **Cloudflare Service Keys**: Images, Turnstile, R2, KV credentials

### 6.2 Required Environment Variables

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

### 6.3 Generate Security Tokens

Generate secure random tokens for the custom authentication variables:

```bash
# Session secret (64 characters recommended)
openssl rand -hex 32

# Custom auth tokens (32 characters)
openssl rand -hex 16

# Alternative format
openssl rand -base64 24
```

### 6.4 Automated Environment Deployment

**✅ Prerequisites**: Before running these scripts, ensure you have:
1. ✅ Configured all worker files (`wrangler.jsonc`) in Step 3
2. ✅ Updated CORS settings in worker source files in Step 4  
3. ✅ Successfully deployed all workers in Step 5

Once your `.env` file is configured and workers are deployed, use the automated deployment scripts:

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

> 📚 **Detailed Documentation**: See [Environment Variables Setup](https://developers.striae.org/striae-dev/get-started/installation-guide/environment-variables-setup) for comprehensive environment setup documentation, troubleshooting, and manual configuration options.

---

## Step 7: Configuration Files

**🎯 Internal Developers**: If you are an internal developer, **skip this entire step**. You will receive pre-configured config files including `config.json`, `firebase.ts`, `inactivity.ts`, and all Turnstile configurations. Use the provided files and proceed directly to Step 8.

**📋 External Developers**: This section is for external developers who need to manually configure their application settings and Firebase integration.

### 7.1 Update Configuration Files

**For External Developers:**

1. **Copy example configurations**:
```bash
cp app/config-example/config.json app/config/config.json
cp app/config-example/firebase.ts app/config/firebase.ts
cp app/config-example/inactivity.ts app/config/inactivity.ts
```

**External Developer Configuration:**

1. **Update `app/config/config.json`**:
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

**Important:** This step must be done AFTER deploying your frontend, as the Pages project needs to exist before you can set environment variables.

If you used the automated deployment scripts in Step 6.4, you still need to set these variables for the Pages project:

- `AUTH_PASSWORD`: Your custom registration password
- `SL_API_KEY`: Your SendLayer API key

**Method 1: Cloudflare Dashboard (Recommended)**
1. Go to **Cloudflare Dashboard** → **Compute (Workers)** → **Your Pages Project**
2. Navigate to **Settings** → **Variables and Secrets**
3. Add the secrets:
   - `AUTH_PASSWORD`: Your custom registration password
   - `SL_API_KEY`: Your SendLayer API key

**Method 2: CLI (Alternative)**
```bash
# Set Pages environment variables using Wrangler CLI
# Replace 'your-pages-project-name' with your actual project name

wrangler pages secret put AUTH_PASSWORD --project-name=your-pages-project-name
# When prompted, enter your custom registration password

wrangler pages secret put SL_API_KEY --project-name=your-pages-project-name
# When prompted, enter your SendLayer API key
```

**Verify Variables Are Set:**
```bash
# List all environment variables for your Pages project
wrangler pages secret list --project-name=your-pages-project-name
```

### 8.3 Configure Custom Domain

1. Go to Cloudflare Pages → Your project → Custom domains
2. Add your custom domain
3. Configure DNS records as instructed

---

## Step 9: Testing and Verification

**🎯 Internal Developers**: You can test your changes on the pre-configured development environment at [https://dev.striae.org](https://dev.striae.org). Firebase authentication, MFA, and all external services are already configured and functional.

**📋 External Developers**: Follow the complete testing steps below to verify your installation.

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

**For Internal Developers:**
1. **Clone dev fork**: `git clone https://github.com/striae-org/striae-dev.git`
2. **Create dev branch**: `git checkout -b your-feature-branch`
3. **Use provided files**: Place received `.env`, config files, and `wrangler.jsonc` files in project
4. **Extract dependencies**: Follow Step 1.1 to extract node package
5. **Deploy workers**: Skip all configuration steps (2-4, 6-7), go directly to Step 5 worker deployment
6. **Start developing**: Test on [https://dev.striae.org](https://dev.striae.org)

**For External Developers:**
1. **Fork & Clone**: Fork `striae-org/striae` to your account → Clone your fork
2. **Setup Environment**: `cp .env.example .env` → Fill values → `./scripts/deploy-env.sh`
3. **Configure Workers**: Copy `wrangler.jsonc.example` files and update settings
4. **Deploy Workers**: `npm install && wrangler deploy` for each worker
5. **Configure App**: Update config files with worker URLs
6. **Deploy Frontend**: `npm run deploy` and set Pages environment variables

---

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure R2 CORS configuration includes your domain
2. **Authentication Failures**: Verify Firebase configuration and worker tokens
3. **Image Upload Issues**: Check environment variable configuration in image worker
4. **Worker Errors**: Verify environment variables and bindings are set correctly

### KV Namespace Configuration Issues

**Error: `KV namespace 'USER_DB' is not valid [code: 10042]`**

This error occurs when the KV namespace configuration uses a name instead of the UUID-format ID:

1. **Check Your Configuration**: Open `workers/user-worker/wrangler.jsonc`
2. **Verify the ID Format**: The `id` field should be a UUID (e.g., `680e629649f957baa393b83d11ca17c6`), not a name like `USER_DB`
3. **Get the Correct ID**: 
   - Go to Cloudflare Dashboard → Storage & Databases → KV
   - Find your `USER_DB` namespace
   - Copy the "Namespace ID" (UUID format)
4. **Update the Configuration**:
   ```json
   "kv_namespaces": [
     {
       "binding": "USER_DB",
       "id": "your-actual-uuid-here"
     }
   ]
   ```
5. **Redeploy**: Run `wrangler deploy` in the user-worker directory

**Error: `A request to the Cloudflare API (/accounts/.../storage/kv/namespaces/...) failed`**

This usually indicates:
- The namespace ID doesn't exist
- Wrong account ID in `wrangler.jsonc`
- Authentication issues with Cloudflare

Double-check your Account ID and KV namespace ID in the Cloudflare dashboard.

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
