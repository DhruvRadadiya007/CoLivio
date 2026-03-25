#!/bin/bash

# Colivio Edge Function Deployment Script
# This script helps deploy the backend server to Supabase Edge Functions

echo "🚀 Colivio Edge Function Deployment"
echo "===================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or using Homebrew (macOS/Linux):"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI is installed"
echo ""

# Check if logged in
echo "📝 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo ""
    echo "Please run:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Project reference
PROJECT_REF="xxhiqqamjhkhbykmehnr"

echo "🔗 Linking to Supabase project: $PROJECT_REF"
supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "❌ Failed to link to project"
    echo ""
    echo "Please check:"
    echo "  1. Project ID is correct"
    echo "  2. You have access to this project"
    echo ""
    exit 1
fi

echo "✅ Project linked"
echo ""

# Deploy the Edge Function
echo "🚀 Deploying Edge Function: make-server-5bec5893"
echo ""

supabase functions deploy make-server-5bec5893

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Deployment failed"
    echo ""
    echo "Common issues:"
    echo "  1. Check server code for syntax errors"
    echo "  2. Ensure all dependencies are available"
    echo "  3. Check Supabase project settings"
    echo ""
    exit 1
fi

echo ""
echo "✅ Edge Function deployed successfully!"
echo ""

# Test the deployment
echo "🧪 Testing deployment..."
HEALTH_URL="https://$PROJECT_REF.supabase.co/functions/v1/make-server-5bec5893/health"

echo "Health check URL: $HEALTH_URL"
echo ""

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Health check passed!"
    echo "   Server is online and responding"
    echo ""
    echo "🎉 Deployment successful! Your Colivio backend is ready!"
    echo ""
    echo "Next steps:"
    echo "  1. Open your app in the browser"
    echo "  2. Try signing up with a test account"
    echo "  3. Check the browser console for connection status"
    echo ""
else
    echo "⚠️  Health check returned status: $RESPONSE"
    echo "   Expected: 200"
    echo ""
    echo "The function deployed but may have issues."
    echo "Check the logs:"
    echo "  supabase functions logs make-server-5bec5893"
    echo ""
fi

# Show logs command
echo "📋 To view logs, run:"
echo "  supabase functions logs make-server-5bec5893"
echo ""
echo "📋 To view all functions:"
echo "  supabase functions list"
echo ""
