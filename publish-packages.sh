#!/bin/bash
set -e
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${BASE_DIR}"

echo "📦 Building and publishing packages..."
echo ""

echo "Building @gaqno-types..."
cd @gaqno-types
TYPES_VERSION=$(node -p "require('./package.json').version")
PUBLISHED_TYPES=$(npm view @gaqno-development/types version 2>/dev/null || echo "")
if [ "${TYPES_VERSION}" = "${PUBLISHED_TYPES}" ]; then
  echo "⏭️  @gaqno-development/types@${TYPES_VERSION} already published, skipping"
else
  npm run build
  npm publish --access restricted
  echo "✅ @gaqno-development/types@${TYPES_VERSION} published"
fi
cd ..
echo ""

echo "Building @gaqno-backcore..."
cd @gaqno-backcore
BACKCORE_VERSION=$(node -p "require('./package.json').version")
PUBLISHED_BACKCORE=$(npm view @gaqno-development/backcore version 2>/dev/null || echo "")
if [ "${BACKCORE_VERSION}" = "${PUBLISHED_BACKCORE}" ]; then
  echo "⏭️  @gaqno-development/backcore@${BACKCORE_VERSION} already published, skipping"
else
  npm run build
  npm publish --access restricted
  echo "✅ @gaqno-development/backcore@${BACKCORE_VERSION} published"
fi
cd ..
echo ""

echo "Publishing @gaqno-frontcore..."
cd @gaqno-frontcore
FRONTCORE_VERSION=$(node -p "require('./package.json').version")
PUBLISHED_FRONTCORE=$(npm view @gaqno-development/frontcore version 2>/dev/null || echo "")
if [ "${FRONTCORE_VERSION}" = "${PUBLISHED_FRONTCORE}" ]; then
  echo "⏭️  @gaqno-development/frontcore@${FRONTCORE_VERSION} already published, skipping"
else
  npm publish --access public
  echo "✅ @gaqno-development/frontcore@${FRONTCORE_VERSION} published"
fi
cd ..
echo ""
echo "🎉 Done."
