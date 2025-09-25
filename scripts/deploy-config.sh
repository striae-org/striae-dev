#!/bin/bash

# ===================================
# STRIAE CONFIGURATION SETUP SCRIPT
# ===================================
# This script sets up all configuration files and replaces placeholders
# Run this BEFORE installing worker dependencies to avoid wrangler validation errors

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}⚙️  Striae Configuration Setup Script${NC}"
echo "====================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📄 .env file not found, copying from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp ".env.example" ".env"
        echo -e "${GREEN}✅ .env file created from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env file with your actual values before proceeding${NC}"
        echo -e "${BLUE}Opening .env file for editing...${NC}"
        
        # Try to open in common editors (VS Code preferred)
        if command -v code > /dev/null; then
            code ".env"
        elif command -v notepad > /dev/null; then
            notepad ".env"
        elif command -v nano > /dev/null; then
            nano ".env"
        else
            echo -e "${YELLOW}Please manually edit .env with your configuration values${NC}"
        fi
        
        echo ""
        read -p "Press Enter after you've updated the .env file with your values..."
        echo ""
    else
        echo -e "${RED}❌ Error: Neither .env nor .env.example file found!${NC}"
        echo "Please create a .env.example file or provide a .env file."
        exit 1
    fi
fi

# Source the .env file
echo -e "${YELLOW}📖 Loading environment variables from .env...${NC}"
source .env

# Validate required variables
required_vars=(
    # Core Cloudflare Configuration
    "ACCOUNT_ID"
    
    # Shared Authentication & Storage
    "SL_API_KEY"
    "USER_DB_AUTH"
    "R2_KEY_SECRET"
    "IMAGES_API_TOKEN"
    
    # Firebase Auth Configuration
    "API_KEY"
    "AUTH_DOMAIN"
    "PROJECT_ID"
    "STORAGE_BUCKET"
    "MESSAGING_SENDER_ID"
    "APP_ID"
    "MEASUREMENT_ID"
    
    # Pages Configuration
    "PAGES_PROJECT_NAME"
    "PAGES_CUSTOM_DOMAIN"
    
    # Worker Names (required for config replacement)
    "KEYS_WORKER_NAME"
    "USER_WORKER_NAME"
    "DATA_WORKER_NAME"
    "AUDIT_WORKER_NAME"
    "IMAGES_WORKER_NAME"
    "TURNSTILE_WORKER_NAME" 
    "PDF_WORKER_NAME"
    
    # Worker Domains (required for config replacement)
    "KEYS_WORKER_DOMAIN"
    "USER_WORKER_DOMAIN"
    "DATA_WORKER_DOMAIN"
    "AUDIT_WORKER_DOMAIN"
    "IMAGES_WORKER_DOMAIN"
    "TURNSTILE_WORKER_DOMAIN"
    "PDF_WORKER_DOMAIN"
    
    # Storage Configuration (required for config replacement)
    "BUCKET_NAME"
    "KV_STORE_ID"
    
    # Worker-Specific Secrets (required for deployment)
    "KEYS_AUTH"
    "ACCOUNT_HASH"
    "API_TOKEN"
    "HMAC_KEY"
    "CFT_PUBLIC_KEY"
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

# Function to copy example configuration files
copy_example_configs() {
    echo -e "\n${BLUE}📋 Copying example configuration files...${NC}"
    
    # Copy app configuration files
    echo -e "${YELLOW}  Copying app configuration files...${NC}"
    
    # Copy app config-example directory to config
    if [ -d "app/config-example" ] && [ ! -d "app/config" ]; then
        cp -r app/config-example app/config
        echo -e "${GREEN}    ✅ app: config directory created from config-example${NC}"
    elif [ -d "app/config" ]; then
        echo -e "${YELLOW}    ⚠️  app: config directory already exists, skipping copy${NC}"
    fi
    
    # Copy turnstile keys.json.example to keys.json
    if [ -f "app/components/turnstile/keys.json.example" ] && [ ! -f "app/components/turnstile/keys.json" ]; then
        cp app/components/turnstile/keys.json.example app/components/turnstile/keys.json
        echo -e "${GREEN}    ✅ turnstile: keys.json created from example${NC}"
    elif [ -f "app/components/turnstile/keys.json" ]; then
        echo -e "${YELLOW}    ⚠️  turnstile: keys.json already exists, skipping copy${NC}"
    fi
    
    # Navigate to each worker directory and copy the example file
    echo -e "${YELLOW}  Copying worker configuration files...${NC}"
    
    cd workers/keys-worker
    if [ -f "wrangler.jsonc.example" ] && [ ! -f "wrangler.jsonc" ]; then
        cp wrangler.jsonc.example wrangler.jsonc
        echo -e "${GREEN}    ✅ keys-worker: wrangler.jsonc created from example${NC}"
    elif [ -f "wrangler.jsonc" ]; then
        echo -e "${YELLOW}    ⚠️  keys-worker: wrangler.jsonc already exists, skipping copy${NC}"
    fi

    cd ../user-worker
    if [ -f "wrangler.jsonc.example" ] && [ ! -f "wrangler.jsonc" ]; then
        cp wrangler.jsonc.example wrangler.jsonc
        echo -e "${GREEN}    ✅ user-worker: wrangler.jsonc created from example${NC}"
    elif [ -f "wrangler.jsonc" ]; then
        echo -e "${YELLOW}    ⚠️  user-worker: wrangler.jsonc already exists, skipping copy${NC}"
    fi

    cd ../data-worker
    if [ -f "wrangler.jsonc.example" ] && [ ! -f "wrangler.jsonc" ]; then
        cp wrangler.jsonc.example wrangler.jsonc
        echo -e "${GREEN}    ✅ data-worker: wrangler.jsonc created from example${NC}"
    elif [ -f "wrangler.jsonc" ]; then
        echo -e "${YELLOW}    ⚠️  data-worker: wrangler.jsonc already exists, skipping copy${NC}"
    fi

    cd ../audit-worker
    if [ -f "wrangler.jsonc.example" ] && [ ! -f "wrangler.jsonc" ]; then
        cp wrangler.jsonc.example wrangler.jsonc
        echo -e "${GREEN}    ✅ audit-worker: wrangler.jsonc created from example${NC}"
    elif [ -f "wrangler.jsonc" ]; then
        echo -e "${YELLOW}    ⚠️  audit-worker: wrangler.jsonc already exists, skipping copy${NC}"
    fi

    cd ../image-worker
    if [ -f "wrangler.jsonc.example" ] && [ ! -f "wrangler.jsonc" ]; then
        cp wrangler.jsonc.example wrangler.jsonc
        echo -e "${GREEN}    ✅ image-worker: wrangler.jsonc created from example${NC}"
    elif [ -f "wrangler.jsonc" ]; then
        echo -e "${YELLOW}    ⚠️  image-worker: wrangler.jsonc already exists, skipping copy${NC}"
    fi

    cd ../turnstile-worker
    if [ -f "wrangler.jsonc.example" ] && [ ! -f "wrangler.jsonc" ]; then
        cp wrangler.jsonc.example wrangler.jsonc
        echo -e "${GREEN}    ✅ turnstile-worker: wrangler.jsonc created from example${NC}"
    elif [ -f "wrangler.jsonc" ]; then
        echo -e "${YELLOW}    ⚠️  turnstile-worker: wrangler.jsonc already exists, skipping copy${NC}"
    fi

    cd ../pdf-worker
    if [ -f "wrangler.jsonc.example" ] && [ ! -f "wrangler.jsonc" ]; then
        cp wrangler.jsonc.example wrangler.jsonc
        echo -e "${GREEN}    ✅ pdf-worker: wrangler.jsonc created from example${NC}"
    elif [ -f "wrangler.jsonc" ]; then
        echo -e "${YELLOW}    ⚠️  pdf-worker: wrangler.jsonc already exists, skipping copy${NC}"
    fi

    # Return to project root
    cd ../..
    
    # Copy main wrangler.toml from example
    if [ -f "wrangler.toml.example" ] && [ ! -f "wrangler.toml" ]; then
        cp wrangler.toml.example wrangler.toml
        echo -e "${GREEN}    ✅ root: wrangler.toml created from example${NC}"
    elif [ -f "wrangler.toml" ]; then
        echo -e "${YELLOW}    ⚠️  root: wrangler.toml already exists, skipping copy${NC}"
    fi
    
    echo -e "${GREEN}✅ Configuration file copying completed${NC}"
}

# Copy example configuration files
copy_example_configs

# Function to prompt for environment variables and update .env file
prompt_for_secrets() {
    echo -e "\n${BLUE}🔐 Environment Variables Setup${NC}"
    echo "=============================="
    echo -e "${YELLOW}Please provide values for the following environment variables.${NC}"
    echo -e "${YELLOW}Press Enter to keep existing values (if any).${NC}"
    echo ""
    
    # Create or backup existing .env
    if [ -f ".env" ]; then
        cp .env .env.backup
        echo -e "${GREEN}📄 Existing .env backed up to .env.backup${NC}"
    fi
    
    # Copy .env.example to .env if it doesn't exist
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo -e "${GREEN}📄 Created .env from .env.example${NC}"
    fi
    
    # Function to prompt for a variable
    prompt_for_var() {
        local var_name=$1
        local description=$2
        local current_value="${!var_name}"
        
        echo -e "${BLUE}$var_name${NC}"
        echo -e "${YELLOW}$description${NC}"
        if [ -n "$current_value" ] && [ "$current_value" != "your_${var_name,,}_here" ]; then
            echo -e "${GREEN}Current value: $current_value${NC}"
            read -p "New value (or press Enter to keep current): " new_value
        else
            read -p "Enter value: " new_value
        fi
        
        if [ -n "$new_value" ]; then
            # Update the .env file
            if grep -q "^$var_name=" .env; then
                sed -i "s|^$var_name=.*|$var_name=$new_value|" .env
            else
                echo "$var_name=$new_value" >> .env
            fi
            export "$var_name=$new_value"
            echo -e "${GREEN}✅ $var_name updated${NC}"
        elif [ -n "$current_value" ]; then
            echo -e "${GREEN}✅ Keeping current value for $var_name${NC}"
        fi
        echo ""
    }
    
    # Function to auto-generate or prompt for secret variables
    prompt_for_secret() {
        local var_name=$1
        local description=$2
        local current_value="${!var_name}"
        
        echo -e "${BLUE}$var_name${NC}"
        echo -e "${YELLOW}$description${NC}"
        
        if [ -n "$current_value" ] && [ "$current_value" != "your_${var_name,,}_here" ]; then
            echo -e "${GREEN}Current value: $current_value${NC}"
            echo -e "${BLUE}Options:${NC}"
            echo -e "  ${YELLOW}1)${NC} Keep current value"
            echo -e "  ${YELLOW}2)${NC} Auto-generate new secure token (recommended)"
            echo -e "  ${YELLOW}3)${NC} Enter custom value"
            read -p "Choose option (1-3) [default: 1]: " choice
            choice=${choice:-1}
        else
            echo -e "${BLUE}Options:${NC}"
            echo -e "  ${YELLOW}1)${NC} Auto-generate secure token (recommended)"
            echo -e "  ${YELLOW}2)${NC} Enter custom value"
            read -p "Choose option (1-2) [default: 1]: " choice
            choice=${choice:-1}
        fi
        
        case $choice in
            1)
                if [ -n "$current_value" ] && [ "$current_value" != "your_${var_name,,}_here" ]; then
                    echo -e "${GREEN}✅ Keeping current value for $var_name${NC}"
                else
                    echo -e "${RED}No current value found, auto-generating...${NC}"
                    new_value=$(openssl rand -hex 32)
                    if [ $? -eq 0 ]; then
                        # Update the .env file
                        if grep -q "^$var_name=" .env; then
                            sed -i "s|^$var_name=.*|$var_name=$new_value|" .env
                        else
                            echo "$var_name=$new_value" >> .env
                        fi
                        export "$var_name=$new_value"
                        echo -e "${GREEN}✅ $var_name auto-generated and saved${NC}"
                    else
                        echo -e "${RED}❌ Failed to generate token with openssl, please enter manually${NC}"
                        read -p "Enter value: " new_value
                        if [ -n "$new_value" ]; then
                            # Update the .env file
                            if grep -q "^$var_name=" .env; then
                                sed -i "s|^$var_name=.*|$var_name=$new_value|" .env
                            else
                                echo "$var_name=$new_value" >> .env
                            fi
                            export "$var_name=$new_value"
                            echo -e "${GREEN}✅ $var_name updated${NC}"
                        fi
                    fi
                fi
                ;;
            2)
                if [ -n "$current_value" ] && [ "$current_value" != "your_${var_name,,}_here" ]; then
                    new_value=$(openssl rand -hex 32)
                    if [ $? -eq 0 ]; then
                        # Update the .env file
                        if grep -q "^$var_name=" .env; then
                            sed -i "s|^$var_name=.*|$var_name=$new_value|" .env
                        else
                            echo "$var_name=$new_value" >> .env
                        fi
                        export "$var_name=$new_value"
                        echo -e "${GREEN}✅ $var_name auto-generated and saved${NC}"
                    else
                        echo -e "${RED}❌ Failed to generate token with openssl, please enter manually${NC}"
                        read -p "Enter value: " new_value
                        if [ -n "$new_value" ]; then
                            # Update the .env file
                            if grep -q "^$var_name=" .env; then
                                sed -i "s|^$var_name=.*|$var_name=$new_value|" .env
                            else
                                echo "$var_name=$new_value" >> .env
                            fi
                            export "$var_name=$new_value"
                            echo -e "${GREEN}✅ $var_name updated${NC}"
                        fi
                    fi
                else
                    read -p "Enter value: " new_value
                    if [ -n "$new_value" ]; then
                        # Update the .env file
                        if grep -q "^$var_name=" .env; then
                            sed -i "s|^$var_name=.*|$var_name=$new_value|" .env
                        else
                            echo "$var_name=$new_value" >> .env
                        fi
                        export "$var_name=$new_value"
                        echo -e "${GREEN}✅ $var_name updated${NC}"
                    fi
                fi
                ;;
            3)
                read -p "Enter custom value: " new_value
                if [ -n "$new_value" ]; then
                    # Update the .env file
                    if grep -q "^$var_name=" .env; then
                        sed -i "s|^$var_name=.*|$var_name=$new_value|" .env
                    else
                        echo "$var_name=$new_value" >> .env
                    fi
                    export "$var_name=$new_value"
                    echo -e "${GREEN}✅ $var_name updated${NC}"
                fi
                ;;
        esac
        echo ""
    }
    
    echo -e "${BLUE}📊 CLOUDFLARE CORE CONFIGURATION${NC}"
    echo "=================================="
    prompt_for_var "ACCOUNT_ID" "Your Cloudflare Account ID"
    
    echo -e "${BLUE}🔐 SHARED AUTHENTICATION & STORAGE${NC}"
    echo "==================================="
    prompt_for_var "SL_API_KEY" "SendLayer API key for email services"
    prompt_for_secret "USER_DB_AUTH" "Custom user database authentication token"
    prompt_for_secret "R2_KEY_SECRET" "Custom R2 storage authentication token"
    prompt_for_var "IMAGES_API_TOKEN" "Cloudflare Images API token (shared between workers)"
    
    echo -e "${BLUE}🔥 FIREBASE AUTH CONFIGURATION${NC}"
    echo "==============================="
    prompt_for_var "API_KEY" "Firebase API key"
    prompt_for_var "AUTH_DOMAIN" "Firebase auth domain (project-id.firebaseapp.com)"
    prompt_for_var "PROJECT_ID" "Firebase project ID"
    prompt_for_var "STORAGE_BUCKET" "Firebase storage bucket"
    prompt_for_var "MESSAGING_SENDER_ID" "Firebase messaging sender ID"
    prompt_for_var "APP_ID" "Firebase app ID"
    prompt_for_var "MEASUREMENT_ID" "Firebase measurement ID (optional)"
    
    echo -e "${BLUE}📄 PAGES CONFIGURATION${NC}"
    echo "======================"
    prompt_for_var "PAGES_PROJECT_NAME" "Your Cloudflare Pages project name"
    prompt_for_var "PAGES_CUSTOM_DOMAIN" "Your custom domain (e.g., striae.org) - DO NOT include https://"
    
    echo -e "${BLUE}🔑 WORKER NAMES & DOMAINS${NC}"
    echo "========================="
    prompt_for_var "KEYS_WORKER_NAME" "Keys worker name"
    prompt_for_var "KEYS_WORKER_DOMAIN" "Keys worker domain (e.g., keys.striae.org) - DO NOT include https://"
    prompt_for_var "USER_WORKER_NAME" "User worker name"
    prompt_for_var "USER_WORKER_DOMAIN" "User worker domain (e.g., users.striae.org) - DO NOT include https://"
    prompt_for_var "DATA_WORKER_NAME" "Data worker name"
    prompt_for_var "DATA_WORKER_DOMAIN" "Data worker domain (e.g., data.striae.org) - DO NOT include https://"
    prompt_for_var "AUDIT_WORKER_NAME" "Audit worker name"
    prompt_for_var "AUDIT_WORKER_DOMAIN" "Audit worker domain (e.g., audit.striae.org) - DO NOT include https://"
    prompt_for_var "IMAGES_WORKER_NAME" "Images worker name"
    prompt_for_var "IMAGES_WORKER_DOMAIN" "Images worker domain (e.g., images.striae.org) - DO NOT include https://"
    prompt_for_var "TURNSTILE_WORKER_NAME" "Turnstile worker name"
    prompt_for_var "TURNSTILE_WORKER_DOMAIN" "Turnstile worker domain (e.g., turnstile.striae.org) - DO NOT include https://"
    prompt_for_var "PDF_WORKER_NAME" "PDF worker name"
    prompt_for_var "PDF_WORKER_DOMAIN" "PDF worker domain (e.g., pdf.striae.org) - DO NOT include https://"
    
    echo -e "${BLUE}🗄️ STORAGE CONFIGURATION${NC}"
    echo "========================="
    prompt_for_var "BUCKET_NAME" "Your R2 bucket name"
    prompt_for_var "KV_STORE_ID" "Your KV namespace ID (UUID format)"
    
    echo -e "${BLUE}🔐 SERVICE-SPECIFIC SECRETS${NC}"
    echo "============================"
    prompt_for_secret "KEYS_AUTH" "Keys worker authentication token"
    prompt_for_var "ACCOUNT_HASH" "Cloudflare Images Account Hash"
    prompt_for_var "API_TOKEN" "Cloudflare Images API token (for Images Worker)"
    prompt_for_var "HMAC_KEY" "Cloudflare Images HMAC signing key"
    prompt_for_var "CFT_PUBLIC_KEY" "Cloudflare Turnstile public key"
    prompt_for_var "CFT_SECRET_KEY" "Cloudflare Turnstile secret key"
    
    # Reload the updated .env file
    source .env
    
    echo -e "${GREEN}🎉 Environment variables setup completed!${NC}"
    echo -e "${BLUE}📄 All values saved to .env file${NC}"
}

# Prompt for secrets if .env doesn't exist or user wants to update
if [ ! -f ".env" ] || [ "$1" = "--update-env" ]; then
    prompt_for_secrets
else
    echo -e "${YELLOW}📝 .env file exists. Use --update-env flag to update environment variables.${NC}"
fi

# Function to replace variables in wrangler configuration files
update_wrangler_configs() {
    echo -e "\n${BLUE}🔧 Updating wrangler configuration files...${NC}"
    
    # Data Worker
    if [ -f "workers/data-worker/wrangler.jsonc" ]; then
        echo -e "${YELLOW}  Updating data-worker/wrangler.jsonc...${NC}"
        sed -i "s/\"DATA_WORKER_NAME\"/\"$DATA_WORKER_NAME\"/g" workers/data-worker/wrangler.jsonc
        sed -i "s/\"ACCOUNT_ID\"/\"$ACCOUNT_ID\"/g" workers/data-worker/wrangler.jsonc
        sed -i "s/\"DATA_WORKER_DOMAIN\"/\"$DATA_WORKER_DOMAIN\"/g" workers/data-worker/wrangler.jsonc
        sed -i "s/\"BUCKET_NAME\"/\"$BUCKET_NAME\"/g" workers/data-worker/wrangler.jsonc
        echo -e "${GREEN}    ✅ data-worker configuration updated${NC}"
    fi
    
    # Update data-worker source file CORS headers only
    if [ -f "workers/data-worker/src/data-worker.js" ]; then
        echo -e "${YELLOW}  Updating data-worker CORS headers...${NC}"
        sed -i "s|'PAGES_CUSTOM_DOMAIN'|'https://$PAGES_CUSTOM_DOMAIN'|g" workers/data-worker/src/data-worker.js
        echo -e "${GREEN}    ✅ data-worker CORS headers updated${NC}"
    fi
    
    # Image Worker
    if [ -f "workers/image-worker/wrangler.jsonc" ]; then
        echo -e "${YELLOW}  Updating image-worker/wrangler.jsonc...${NC}"
        sed -i "s/\"IMAGES_WORKER_NAME\"/\"$IMAGES_WORKER_NAME\"/g" workers/image-worker/wrangler.jsonc
        sed -i "s/\"ACCOUNT_ID\"/\"$ACCOUNT_ID\"/g" workers/image-worker/wrangler.jsonc
        sed -i "s/\"IMAGES_WORKER_DOMAIN\"/\"$IMAGES_WORKER_DOMAIN\"/g" workers/image-worker/wrangler.jsonc
        echo -e "${GREEN}    ✅ image-worker configuration updated${NC}"
    fi
    
    # Update image-worker source file CORS headers only
    if [ -f "workers/image-worker/src/image-worker.js" ]; then
        echo -e "${YELLOW}  Updating image-worker CORS headers...${NC}"
        sed -i "s|'PAGES_CUSTOM_DOMAIN'|'https://$PAGES_CUSTOM_DOMAIN'|g" workers/image-worker/src/image-worker.js
        echo -e "${GREEN}    ✅ image-worker CORS headers updated${NC}"
    fi
    
    # Keys Worker
    if [ -f "workers/keys-worker/wrangler.jsonc" ]; then
        echo -e "${YELLOW}  Updating keys-worker/wrangler.jsonc...${NC}"
        sed -i "s/\"KEYS_WORKER_NAME\"/\"$KEYS_WORKER_NAME\"/g" workers/keys-worker/wrangler.jsonc
        sed -i "s/\"ACCOUNT_ID\"/\"$ACCOUNT_ID\"/g" workers/keys-worker/wrangler.jsonc
        sed -i "s/\"KEYS_WORKER_DOMAIN\"/\"$KEYS_WORKER_DOMAIN\"/g" workers/keys-worker/wrangler.jsonc
        echo -e "${GREEN}    ✅ keys-worker configuration updated${NC}"
    fi
    
    # Update keys-worker source file CORS headers only
    if [ -f "workers/keys-worker/src/keys.js" ]; then
        echo -e "${YELLOW}  Updating keys-worker CORS headers...${NC}"
        sed -i "s|'PAGES_CUSTOM_DOMAIN'|'https://$PAGES_CUSTOM_DOMAIN'|g" workers/keys-worker/src/keys.js
        echo -e "${GREEN}    ✅ keys-worker CORS headers updated${NC}"
    fi
    
    # PDF Worker
    if [ -f "workers/pdf-worker/wrangler.jsonc" ]; then
        echo -e "${YELLOW}  Updating pdf-worker/wrangler.jsonc...${NC}"
        sed -i "s/\"PDF_WORKER_NAME\"/\"$PDF_WORKER_NAME\"/g" workers/pdf-worker/wrangler.jsonc
        sed -i "s/\"ACCOUNT_ID\"/\"$ACCOUNT_ID\"/g" workers/pdf-worker/wrangler.jsonc
        sed -i "s/\"PDF_WORKER_DOMAIN\"/\"$PDF_WORKER_DOMAIN\"/g" workers/pdf-worker/wrangler.jsonc
        echo -e "${GREEN}    ✅ pdf-worker configuration updated${NC}"
    fi
    
    # Update pdf-worker source file CORS headers only
    if [ -f "workers/pdf-worker/src/pdf-worker.js" ]; then
        echo -e "${YELLOW}  Updating pdf-worker CORS headers...${NC}"
        sed -i "s|'PAGES_CUSTOM_DOMAIN'|'https://$PAGES_CUSTOM_DOMAIN'|g" workers/pdf-worker/src/pdf-worker.js
        echo -e "${GREEN}    ✅ pdf-worker CORS headers updated${NC}"
    fi
    
    # Turnstile Worker
    if [ -f "workers/turnstile-worker/wrangler.jsonc" ]; then
        echo -e "${YELLOW}  Updating turnstile-worker/wrangler.jsonc...${NC}"
        sed -i "s/\"TURNSTILE_WORKER_NAME\"/\"$TURNSTILE_WORKER_NAME\"/g" workers/turnstile-worker/wrangler.jsonc
        sed -i "s/\"ACCOUNT_ID\"/\"$ACCOUNT_ID\"/g" workers/turnstile-worker/wrangler.jsonc
        sed -i "s/\"TURNSTILE_WORKER_DOMAIN\"/\"$TURNSTILE_WORKER_DOMAIN\"/g" workers/turnstile-worker/wrangler.jsonc
        echo -e "${GREEN}    ✅ turnstile-worker configuration updated${NC}"
    fi
    
    # Update turnstile-worker source file CORS headers only
    if [ -f "workers/turnstile-worker/src/turnstile.js" ]; then
        echo -e "${YELLOW}  Updating turnstile-worker CORS headers...${NC}"
        sed -i "s|'PAGES_CUSTOM_DOMAIN'|'https://$PAGES_CUSTOM_DOMAIN'|g" workers/turnstile-worker/src/turnstile.js
        echo -e "${GREEN}    ✅ turnstile-worker CORS headers updated${NC}"
    fi
    
    # User Worker
    if [ -f "workers/user-worker/wrangler.jsonc" ]; then
        echo -e "${YELLOW}  Updating user-worker/wrangler.jsonc...${NC}"
        sed -i "s/\"USER_WORKER_NAME\"/\"$USER_WORKER_NAME\"/g" workers/user-worker/wrangler.jsonc
        sed -i "s/\"ACCOUNT_ID\"/\"$ACCOUNT_ID\"/g" workers/user-worker/wrangler.jsonc
        sed -i "s/\"USER_WORKER_DOMAIN\"/\"$USER_WORKER_DOMAIN\"/g" workers/user-worker/wrangler.jsonc
        sed -i "s/\"KV_STORE_ID\"/\"$KV_STORE_ID\"/g" workers/user-worker/wrangler.jsonc
        echo -e "${GREEN}    ✅ user-worker configuration updated${NC}"
    fi
    
    # Update user-worker source file CORS headers and worker URLs only
    if [ -f "workers/user-worker/src/user-worker.js" ]; then
        echo -e "${YELLOW}  Updating user-worker CORS headers and worker URLs...${NC}"
        sed -i "s|'PAGES_CUSTOM_DOMAIN'|'https://$PAGES_CUSTOM_DOMAIN'|g" workers/user-worker/src/user-worker.js
        sed -i "s|'DATA_WORKER_DOMAIN'|'https://$DATA_WORKER_DOMAIN'|g" workers/user-worker/src/user-worker.js
        sed -i "s|'IMAGES_WORKER_DOMAIN'|'https://$IMAGES_WORKER_DOMAIN'|g" workers/user-worker/src/user-worker.js
        echo -e "${GREEN}    ✅ user-worker CORS headers and worker URLs updated${NC}"
    fi
    
    # Main wrangler.toml
    if [ -f "wrangler.toml" ]; then
        echo -e "${YELLOW}  Updating wrangler.toml...${NC}"
        sed -i "s/\"PAGES_PROJECT_NAME\"/\"$PAGES_PROJECT_NAME\"/g" wrangler.toml
        echo -e "${GREEN}    ✅ main wrangler.toml configuration updated${NC}"
    fi
    
    # Update app configuration files
    echo -e "${YELLOW}  Updating app configuration files...${NC}"
    
    # Update app/config/config.json
    if [ -f "app/config/config.json" ]; then
        echo -e "${YELLOW}    Updating app/config/config.json...${NC}"
        sed -i "s|\"PAGES_CUSTOM_DOMAIN\"|\"https://$PAGES_CUSTOM_DOMAIN\"|g" app/config/config.json
        sed -i "s|\"DATA_WORKER_CUSTOM_DOMAIN\"|\"https://$DATA_WORKER_DOMAIN\"|g" app/config/config.json
        sed -i "s|\"AUDIT_WORKER_CUSTOM_DOMAIN\"|\"https://$AUDIT_WORKER_DOMAIN\"|g" app/config/config.json
        sed -i "s|\"KEYS_WORKER_CUSTOM_DOMAIN\"|\"https://$KEYS_WORKER_DOMAIN\"|g" app/config/config.json
        sed -i "s|\"IMAGE_WORKER_CUSTOM_DOMAIN\"|\"https://$IMAGES_WORKER_DOMAIN\"|g" app/config/config.json
        sed -i "s|\"USER_WORKER_CUSTOM_DOMAIN\"|\"https://$USER_WORKER_DOMAIN\"|g" app/config/config.json
        sed -i "s|\"PDF_WORKER_CUSTOM_DOMAIN\"|\"https://$PDF_WORKER_DOMAIN\"|g" app/config/config.json
        sed -i "s|\"YOUR_KEYS_AUTH_TOKEN\"|\"$KEYS_AUTH\"|g" app/config/config.json
        echo -e "${GREEN}      ✅ app config.json updated${NC}"
    fi
    
    # Update app/config/firebase.ts
    if [ -f "app/config/firebase.ts" ]; then
        echo -e "${YELLOW}    Updating app/config/firebase.ts...${NC}"
        sed -i "s|\"YOUR_FIREBASE_API_KEY\"|\"$API_KEY\"|g" app/config/firebase.ts
        sed -i "s|\"YOUR_FIREBASE_AUTH_DOMAIN\"|\"$AUTH_DOMAIN\"|g" app/config/firebase.ts
        sed -i "s|\"YOUR_FIREBASE_PROJECT_ID\"|\"$PROJECT_ID\"|g" app/config/firebase.ts
        sed -i "s|\"YOUR_FIREBASE_STORAGE_BUCKET\"|\"$STORAGE_BUCKET\"|g" app/config/firebase.ts
        sed -i "s|\"YOUR_FIREBASE_MESSAGING_SENDER_ID\"|\"$MESSAGING_SENDER_ID\"|g" app/config/firebase.ts
        sed -i "s|\"YOUR_FIREBASE_APP_ID\"|\"$APP_ID\"|g" app/config/firebase.ts
        sed -i "s|\"YOUR_FIREBASE_MEASUREMENT_ID\"|\"$MEASUREMENT_ID\"|g" app/config/firebase.ts
        echo -e "${GREEN}      ✅ app firebase.ts updated${NC}"
    fi
    
    # Update app/components/turnstile/keys.json
    if [ -f "app/components/turnstile/keys.json" ]; then
        echo -e "${YELLOW}    Updating app/components/turnstile/keys.json...${NC}"
        sed -i "s|\"insert-your-turnstile-site-key-here\"|\"$CFT_PUBLIC_KEY\"|g" app/components/turnstile/keys.json
        sed -i "s|\"https://turnstile.your-domain.com\"|\"https://$TURNSTILE_WORKER_DOMAIN\"|g" app/components/turnstile/keys.json
        echo -e "${GREEN}      ✅ turnstile keys.json updated${NC}"
    fi
    
    echo -e "${GREEN}✅ All configuration files updated${NC}"
}

# Update wrangler configurations
update_wrangler_configs

echo -e "\n${GREEN}🎉 Configuration setup completed!${NC}"
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "   1. Install worker dependencies"
echo "   2. Deploy workers"
echo "   3. Deploy worker secrets"
echo "   4. Deploy pages"
echo "   5. Deploy pages secrets"
echo -e "\n${GREEN}✨ Ready for deployment!${NC}"