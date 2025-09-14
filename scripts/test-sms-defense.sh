#!/bin/bash

# Simple test script for SMS Defense Worker
echo "🧪 Testing SMS Defense Worker"
echo "================================"

# Set test environment variables
export SMS_DEFENSE_AUTH="test-auth-key"
export RECAPTCHA_API_KEY="test-api-key"
export RECAPTCHA_SITE_KEY="test-site-key"
export RECAPTCHA_PROJECT_ID="test-project-123"

echo "📦 Starting SMS Defense Worker..."
cd "$(dirname "$0")/../workers/sms-defense-worker"
npx wrangler dev --port 8787 --local &
WORKER_PID=$!

echo "⏳ Waiting for worker to start..."
sleep 5

echo "🔍 Testing health endpoint..."
curl -X GET "http://localhost:8787/health" \
  -H "X-Custom-Auth-Key: test-auth-key" \
  -H "Content-Type: application/json"

echo -e "\n"
echo "🧪 Testing authentication (should fail)..."
curl -X GET "http://localhost:8787/health" \
  -H "Content-Type: application/json"

echo -e "\n"
echo "🛑 Stopping worker..."
kill $WORKER_PID

echo "✅ Test complete!"