# Striae Deployment Guide

## Deployment Overview

Striae uses a modern cloud-native deployment strategy built on Cloudflare's edge computing platform. This guide covers the complete deployment process from development to production.

## Prerequisites

### Required Accounts and Services

1. **Cloudflare Account** with:
   - Cloudflare Pages
   - Cloudflare Workers
   - Cloudflare Turnstile
   - Cloudflare Images
   - Cloudflare KV storage namespace created
   - Cloudflare R2 Object Storage bucket created
   - Custom domain configured

2. **Firebase Project** with:
   - Authentication enabled
   - Multi-factor authentication configured
   - Web app registered

3. **SendLayer Account** with:
   - API access enabled
   - Email domain verified

4. **Development Tools**:
   - Node.js (v20.0.0 or higher)
   - Wrangler CLI
   - Git
   - 7-Zip (for extracting node package dependencies)

## Environment Setup

### 1. Environment Variables Configuration

Striae uses a centralized environment variables system. Follow these steps:

#### Copy Environment Template

```bash
cp .env.example .env
```

#### Fill in Environment Variables

Update the `.env` file with your actual values. The file is organized by service:

**Cloudflare Services:**
- `ACCOUNT_ID` - Your Cloudflare Account ID
- `IMAGES_API_TOKEN` - Cloudflare Images API token
- `IMAGES_ACCOUNT_HASH` - Cloudflare Images Account Hash  
- `HMAC_KEY` - Cloudflare Images HMAC signing key
- `CFT_SECRET_KEY` - Cloudflare Turnstile secret key

**External Services:**
- `SL_API_KEY` - SendLayer API token

**Custom Security Tokens** (generate secure random tokens):
- `R2_KEY_SECRET` - R2 authentication token
- `USER_DB_AUTH` - KV authentication token
- `KEYS_AUTH` - Key handler authentication token
- `AUTH_PASSWORD` - Registration password

#### Generate Security Tokens

```bash
# Session secret (64 characters recommended)
openssl rand -hex 32

# Custom auth tokens (32 characters)
openssl rand -hex 16

# Alternative format
openssl rand -base64 24
```

#### Deploy Environment Variables

Use the automated deployment scripts:

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

### 2. KV and R2 Configuration

#### Create KV Namespaces

Create KV namespace in Cloudflare dashboard:
- `user-db` - User profile storage

#### Create R2 Bucket

Create R2 bucket (`striae-data`) for data storage and configure CORS settings.

#### Update Worker Configuration Files

Update `wrangler.jsonc` files in each worker directory:
- Replace `YOUR_ACCOUNT_ID` with your Cloudflare Account ID
- Update KV namespace ID in user-worker
- Update R2 bucket name in data-worker

## Deployment Process

### 1. Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Firebase project configured and connected
- [ ] Cloudflare KV namespace created
- [ ] Cloudflare R2 bucket created
- [ ] Domain DNS configured to point to Cloudflare
- [ ] SSL/TLS certificates configured
- [ ] All tests passing locally

### 2. Worker Deployment

Deploy each worker in the following order. If you used the automated environment deployment scripts, environment variables are already configured.

#### Extract Node Package Dependencies (First Time Setup)

```bash
# Navigate to the node-package directory
cd node-package

# Extract using 7-Zip (Windows)
7z x striae-functional-node-package.7z -o..

# Or on Linux/macOS
7z x striae-functional-node-package.7z -o..

# Navigate back to project root
cd ..
```

#### Keys Worker (Deploy First)

```bash
cd workers/keys-worker
npm install
wrangler deploy
```

**Environment variables configured via automated scripts:**

- `ACCOUNT_HASH` - Cloudflare Images Account Hash
- `AUTH_PASSWORD` - Custom registration password
- `IMAGES_API_TOKEN` - Cloudflare Images API token
- `KEYS_AUTH` - Custom keys authentication token
- `R2_KEY_SECRET` - Custom R2 authentication token
- `USER_DB_AUTH` - Custom KV authentication token

#### User Worker

```bash
cd ../user-worker
npm install
wrangler deploy
```

**Environment variables configured via automated scripts:**

- `USER_DB_AUTH` - Custom KV authentication token

**KV Bindings (configured in wrangler.jsonc):**

- `USER_DB` → KV namespace (update namespace ID in wrangler.jsonc)

#### Data Worker

```bash
cd ../data-worker
npm install
wrangler deploy
```

**Environment variables configured via automated scripts:**

- `R2_KEY_SECRET` - Custom R2 authentication token

**R2 Bindings (configured in wrangler.jsonc):**

- `STRIAE_DATA` → R2 bucket (update bucket name in wrangler.jsonc)

#### Image Worker

```bash
cd ../image-worker
npm install
wrangler deploy
```

**Environment variables configured via automated scripts:**

- `ACCOUNT_ID` - Cloudflare Account ID
- `ACCOUNT_HASH` - Cloudflare Images Account Hash
- `API_TOKEN` - Cloudflare Images API token
- `HMAC_KEY` - Cloudflare Images HMAC signing key

#### Turnstile Worker

```bash
cd ../turnstile-worker
npm install
wrangler deploy
```

**Environment variables configured via automated scripts:**

- `CFT_SECRET_KEY` - Cloudflare Turnstile secret key

#### PDF Worker

```bash
cd ../pdf-worker
npm install
wrangler deploy
```

**No environment variables required** (uses browser binding only)

### 3. Main Application Deployment

#### Configure Application Files

```bash
# Copy configuration examples
cp app/config-example/config.json app/config/config.json
cp app/config-example/firebase.ts app/config/firebase.ts
cp app/config-example/inactivity.ts app/config/inactivity.ts
```

Update configuration files:

1. **app/config/config.json** - Add worker URLs and configuration
2. **app/components/turnstile/keys.json** - Add Turnstile public key and worker URL
3. **app/config/firebase.ts** - Add Firebase configuration
4. **wrangler.toml** - Configure Pages project name

#### Build Application

```bash
# Use pre-configured dependencies (do not run npm install)
# Build for production
npm run build
```

#### Deploy to Cloudflare Pages

```bash
# Deploy using Wrangler
npm run deploy
```

#### Configure Pages Environment Variables

Set these variables manually in the Cloudflare Pages Dashboard:

- `AUTH_PASSWORD` - Custom registration password
- `SL_API_KEY` - SendLayer API key

#### Update CORS Headers

Update CORS headers in all worker source files to match your domain:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-domain.com', // Update this
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Custom-Auth-Key',
  'Content-Type': 'application/json'
};
```

Redeploy all workers after updating CORS headers.

### 4. Domain Configuration

#### Custom Domain Setup

1. **Add Custom Domain to Pages**:
   - Go to Cloudflare Pages → Your project → Custom domains
   - Click "Set up a custom domain"
   - Enter your domain name (e.g., `striae.org` and/or `www.striae.org`)
   - Click "Continue"

2. **DNS Configuration (Automatic)**:
   - Cloudflare Pages automatically creates the necessary DNS records
   - If your domain is already on Cloudflare, DNS records are added automatically
   - If your domain is external, Cloudflare will provide DNS records to add to your domain registrar
   - No manual A/AAAA record configuration needed

3. **Domain Verification**:
   - Cloudflare will automatically verify domain ownership
   - SSL certificate is automatically provisioned and configured
   - Process typically takes 5-15 minutes

#### SSL/TLS Configuration (Manual Setup Required)

While Cloudflare Pages automatically provisions SSL certificates, you must manually configure SSL/TLS settings in the Cloudflare dashboard:

1. **Go to Cloudflare Dashboard → SSL/TLS**:
   - Set encryption mode to **"Full (strict)"** (recommended for production)
   - Alternative: **"Full"** (minimum requirement)

2. **Configure Edge Certificates**:
   - Universal SSL certificate is automatically provisioned
   - Verify certificate status shows "Active"

3. **Configure Minimum TLS Version**:
   - Go to SSL/TLS → Edge Certificates
   - Set **Minimum TLS Version** to **TLS 1.0** (minimum requirement)
   - Recommended: **TLS 1.2** or higher for enhanced security

4. **Enable Security Features**:
   - **Always Use HTTPS**: Enable to redirect HTTP to HTTPS
   - **HTTP Strict Transport Security (HSTS)**: Enable for enhanced security
   - **Authenticated Origin Pulls**: Optional, for additional origin security

#### Verification Steps

1. Wait for domain verification to complete in Pages dashboard
2. Test your domain resolves correctly: `https://your-domain.com`
3. Verify SSL certificate is active (look for padlock icon in browser)
4. Test www and non-www variants if both are configured

## Production Configuration

### 1. Security Configuration

#### Cloudflare Security Settings

1. **Web Application Firewall (WAF)**:
   - Enable default managed rulesets (automatically applied)
   - Cloudflare Managed Ruleset provides comprehensive protection
   - Custom rules and rate limiting are optional for most deployments

2. **DDoS Protection**:
   - Enable DDoS protection (minimum requirement)
   - Default sensitivity settings are sufficient for most applications
   - Automatic mitigation is enabled by default

3. **Access Control**:
   - Use **Cloudflare Zero Trust** for advanced access control policies if needed
   - Configure IP allowlists through Zero Trust for specific requirements
   - Configure email domain-based allowlists if needed
   - Set up geographic restrictions via Zero Trust policies
   - Basic Cloudflare security is sufficient for most public deployments

#### Worker Security

1. **Authentication**:
   - Use the automated environment deployment system
   - Rotate API keys regularly using the provided scripts
   - Implement proper CORS policies for your domain
   - Use environment variables for all secrets

2. **Data Protection**:
   - Enable request/response logging
   - Implement audit trails
   - Configure data retention policies
   - Use signed URLs for image access

### 2. Monitoring and Alerting

#### Alerting Configuration

1. **Cloudflare Alerts**:
   - Configure alerts for high error rates
   - Set up notifications for worker failures
   - Monitor KV/R2 operation failures

2. **External Monitoring**:
   - Set up uptime monitoring
   - Configure performance alerts
   - Implement log aggregation

## Rollback Procedures

### 1. Application Rollback

#### Cloudflare Pages Rollback

##### GitHub Revert

1. Go to GitHub repository → History tab
2. Find the commit you want to revert
3. Right-click on the commit to view options
4. Click "Revert changes in commit"
5. Create pull request or commit directly to master branch
6. If using PR: Review and merge the revert pull request
7. Redeploy the application using `npm run deploy`

#### Worker Rollback

##### Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Workers & Pages → Your worker
2. Click on "Deployments" or "Versions" tab
3. Select the previous working version
4. Click "Deploy"
5. Verify the worker is functioning correctly
6. Update worker source code in repository

## Post-Deployment Verification

### Manual Testing Checklist

- [ ] User authentication flow (including MFA)
- [ ] User registration and profile management
- [ ] Case creation and management
- [ ] Image upload and display
- [ ] Annotation functionality
- [ ] PDF generation
- [ ] Email notifications
- [ ] CAPTCHA verification (Turnstile)
- [ ] Mobile responsiveness (front page only)
- [ ] CORS functionality across all workers

## Maintenance Procedures

### 1. Regular Maintenance

#### Monthly Tasks

- Review error logs and metrics
- Check security alerts
- Update dependencies if needed

#### Semi-annual Tasks

- Rotate API keys and secrets
- Review and update security configurations
- Performance optimization review
- Capacity planning review

### 2. Update Procedures

#### Application Updates

1. Deploy to staging environment
2. Run full test suite
3. Perform security scan
4. Deploy to production
5. Monitor for issues
6. Rollback if necessary

#### Dependency Updates

1. Review security advisories
2. Test updates in development
3. Staged rollout to production
4. Monitor for compatibility issues

## Troubleshooting

### Common Deployment Issues

1. **Worker Deployment Failures**:
   - Check environment variables using `wrangler secret list`
   - Verify KV namespace bindings in wrangler.jsonc
   - Verify R2 bucket bindings in wrangler.jsonc
   - Review worker limits and quotas (increase if needed)
   - Check node package extraction completed successfully

2. **Authentication Issues**:
   - Verify Firebase configuration in app/config/firebase.ts
   - Check API key permissions and rotation
   - Review CORS settings match your domain exactly
   - Verify Turnstile keys are correctly configured

3. **Performance Issues**:
   - Check worker execution times/status/errors in Cloudflare dashboard
   - Review KV operation performance
   - Review R2 operation performance
   - Check network latency

4. **CORS Issues**:
   - Ensure all worker CORS headers match your domain
   - Verify R2 bucket CORS configuration
   - Check for HTTP vs HTTPS mismatches
   - Verify subdomain configuration (www vs non-www)

### Support Resources

1. **Cloudflare Documentation**: [developers.cloudflare.com](https://developers.cloudflare.com)
2. **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)
3. **Striae Discord**: Community support and discussion
4. **GitHub Issues**: Bug reports and feature requests
5. **Environment Setup Guide**: See `ENV_SETUP.md` for detailed environment configuration
6. **Installation Guide**: See `INSTALLATION.md` for complete setup procedures
