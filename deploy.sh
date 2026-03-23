#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔨 Building..."
rm -rf out .next
npm run build

echo ""
echo "🚀 Deploying to Cloudflare Pages..."
npx wrangler pages deploy out/ --project-name=family-travel-site

echo ""
echo "✅ Done! Site: https://family-travel-site.pages.dev"
