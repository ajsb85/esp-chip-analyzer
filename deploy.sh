#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Building ESP32 Chip & USB Bridge Analyzer..."
npm run build

echo "📁 Navigating into dist folder..."
cd dist

# Recreate .nojekyll in build output to guarantee Jekyll bypass
echo "" > .nojekyll

echo "🔧 Initializing temporary Git repository in build folder..."
git init
git checkout -B gh-pages
git add -A
git commit -m "Production Build Deployment $(date)"

echo "🌍 Fetching remote URL from parent repository..."
REMOTE_URL=$(git -C .. remote get-url origin)

echo "🛰️ Pushing build output to ${REMOTE_URL} on branch gh-pages..."
git push -f "$REMOTE_URL" gh-pages:gh-pages

echo "🎉 Deployment successful!"
