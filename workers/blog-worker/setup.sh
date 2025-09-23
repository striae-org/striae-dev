#!/bin/bash

# Setup script for blog-worker
# Creates KV namespace and configures environment

echo "Setting up blog-worker..."

# Create KV namespace for blog cache
echo "Creating KV namespace for blog cache..."
npx wrangler kv:namespace create "BLOG_CACHE"
echo ""
echo "Please update wrangler.jsonc with the KV namespace ID returned above"
echo ""

# Install dependencies
echo "Installing blog-worker dependencies..."
cd workers/blog-worker
npm install

echo ""
echo "Blog worker setup complete!"
echo ""
echo "Next steps:"
echo "1. Update workers/blog-worker/wrangler.jsonc with your KV namespace ID"
echo "2. Run: npm run deploy (from blog-worker directory)"
echo "3. Update app/config/config.json with your blog worker URL"