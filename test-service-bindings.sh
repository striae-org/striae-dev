#!/bin/bash

# Test script to verify service bindings are working correctly
# This script tests the new authentication architecture

echo "🔑 Testing Striae Service Bindings Architecture"
echo "================================================"

# Configuration
KEYS_URL="https://origin.striae.org"
DATA_URL="https://origin2.striae.org"
USER_URL="https://origin4.striae.org"
IMAGE_URL="https://origin3.striae.org"

# Test 1: Keys Worker HTTP Interface (Legacy)
echo "📌 Test 1: Keys Worker HTTP Interface"
echo "Testing direct key retrieval..."

# You'll need to replace YOUR_KEYS_AUTH with actual value
KEYS_AUTH="your-keys-auth-token"

response=$(curl -s -w "%{http_code}" -H "X-Custom-Auth-Key: $KEYS_AUTH" "$KEYS_URL/R2_KEY_SECRET")
http_code=${response: -3}
if [ "$http_code" = "200" ]; then
    echo "✅ Keys worker HTTP interface working"
else
    echo "❌ Keys worker HTTP interface failed (HTTP $http_code)"
fi

# Test 2: Data Worker Service Binding
echo "📌 Test 2: Data Worker Authentication"
echo "Testing service binding authentication..."

# You'll need to replace with actual API key
USER_AUTH="your-user-auth-token"

response=$(curl -s -w "%{http_code}" -H "X-User-Auth: $USER_AUTH" "$DATA_URL/test-file.json")
http_code=${response: -3}
if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
    echo "✅ Data worker service binding working"
else
    echo "❌ Data worker service binding failed (HTTP $http_code)"
fi

# Test 3: User Worker Service Binding
echo "📌 Test 3: User Worker Authentication"
echo "Testing user worker service binding..."

response=$(curl -s -w "%{http_code}" -H "X-User-Auth: $USER_AUTH" "$USER_URL/test-user-id")
http_code=${response: -3}
if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
    echo "✅ User worker service binding working"
else
    echo "❌ User worker service binding failed (HTTP $http_code)"
fi

# Test 4: Image Worker Service Binding
echo "📌 Test 4: Image Worker Authentication"
echo "Testing image worker service binding..."

response=$(curl -s -w "%{http_code}" -H "Authorization: Bearer your-image-token" "$IMAGE_URL/test-image-id")
http_code=${response: -3}
if [ "$http_code" = "200" ] || [ "$http_code" = "404" ] || [ "$http_code" = "403" ]; then
    echo "✅ Image worker responding to authentication"
else
    echo "❌ Image worker authentication failed (HTTP $http_code)"
fi

echo ""
echo "🎯 Test Summary"
echo "==============="
echo "All workers should respond with 200, 404, or proper error codes."
echo "403 errors indicate authentication is working but keys need updating."
echo "500 errors may indicate service binding issues."
echo ""
echo "Next steps:"
echo "1. Update the test script with your actual API keys"
echo "2. Deploy workers in correct order: keys → data/user/image → frontend"
echo "3. Monitor Cloudflare dashboard for any service binding errors"
