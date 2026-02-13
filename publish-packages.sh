#!/bin/bash
set -e
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${BASE_DIR}"

echo "📦 Building and publishing packages..."
echo ""

echo "Building @gaqno-backcore..."
cd @gaqno-backcore
npm run build
npm publish --access restricted
cd ..
echo "✅ @gaqno-development/backcore published"
echo ""

echo "Publishing @gaqno-frontcore..."
cd @gaqno-frontcore
npm publish --access public
cd ..
echo "✅ @gaqno-development/frontcore published"
echo ""
echo "🎉 Packages published successfully!"
