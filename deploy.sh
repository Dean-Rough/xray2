#!/bin/bash
# Manual deployment script to bypass git sync issues

echo "🚀 Manual Vercel deployment starting..."
echo "📁 Working directory: $(pwd)"
echo "🔧 Using existing Vercel project with env vars"

# Install Vercel CLI if needed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy directly from current directory
echo "🚀 Deploying to Vercel..."
cd src
vercel --prod --yes --token=$VERCEL_TOKEN

echo "✅ Deployment complete!"
