#!/bin/bash

# Manual build validation script
# Use this to validate builds without pushing

set -e

echo "🔍 Running manual build validation..."

# Get all directories with package.json (excluding root and all node_modules)
DIRS=$(find . -maxdepth 2 -name "package.json" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "*/node_modules/*" -not -path "./package.json" | sed 's|/package.json||' | grep -v "^\.$" | sort)

if [ -z "$DIRS" ]; then
    echo -e "${YELLOW}⚠️  No directories with package.json found${NC}"
    echo -e "${GREEN}✅ Nothing to validate${NC}"
    exit 0
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get NPM token
NPM_TOKEN=""
if [ -f ".npmrc" ]; then
    NPM_TOKEN=$(cat .npmrc | grep "_authToken" | cut -d'=' -f2)
elif [ -f "$HOME/.npmrc.personal" ]; then
    NPM_TOKEN=$(cat "$HOME/.npmrc.personal" | grep "_authToken" | cut -d'=' -f2)
fi

OVERALL_SUCCESS=true

for dir in $DIRS; do
    if [ -d "$dir" ]; then
        echo -e "\n${YELLOW}🔍 Processing $dir...${NC}"
        
        # Run npm build
        echo -e "${YELLOW}📦 Building $dir...${NC}"
        cd "$dir"
        if npm run build; then
            echo -e "${GREEN}✅ npm build successful for $dir${NC}"
        else
            echo -e "${RED}❌ npm build failed for $dir${NC}"
            OVERALL_SUCCESS=false
        fi
        cd - > /dev/null
        
        # Run Docker build if Dockerfile exists
        if [ -f "$dir/Dockerfile" ]; then
            echo -e "${YELLOW}🐳 Building Docker image for $dir...${NC}"
            image_name=$(basename "$dir"):test
            if [ -n "$NPM_TOKEN" ]; then
                if docker build -f "$dir/Dockerfile" --build-arg NPM_TOKEN="$NPM_TOKEN" -t "$image_name" "$dir"; then
                    echo -e "${GREEN}✅ Docker build successful for $dir${NC}"
                else
                    echo -e "${RED}❌ Docker build failed for $dir${NC}"
                    OVERALL_SUCCESS=false
                fi
            else
                echo -e "${YELLOW}⚠️  Skipping Docker build for $dir (no NPM_TOKEN)${NC}"
            fi
        fi
    fi
done

echo -e "\n${YELLOW}📋 Manual validation complete${NC}"

if [ "$OVERALL_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ All validations passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some validations failed.${NC}"
    exit 1
fi
