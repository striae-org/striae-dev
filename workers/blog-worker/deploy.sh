#!/bin/bash

# Deploy blog-worker to Cloudflare
# Run this from the blog-worker directory

echo "Deploying blog-worker to Cloudflare..."

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Deploy the worker
echo "Deploying worker..."
wrangler deploy

echo ""
echo "Blog worker deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Update app/config/config.json with your worker URL"
echo "2. Test the endpoint: https://your-worker-url.dev.striae.org/api/feed"