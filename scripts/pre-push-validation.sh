#!/bin/bash

# Pre-push hook to validate builds and Docker images
# This script ensures that all changed projects can build successfully
# both locally and with Docker before allowing push

set -e

echo "🔍 Running pre-push validation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get changed directories (excluding root)
CHANGED_DIRS=$(git diff --cached --name-only | grep -E "^[^/]+/[^/]+/" | cut -d'/' -f1 | sort -u | grep -v "^\.$")

# Get NPM token
NPM_TOKEN=""
if [ -f ".npmrc" ]; then
    NPM_TOKEN=$(cat .npmrc | grep "_authToken" | cut -d'=' -f2)
elif [ -f "~/.npmrc.personal" ]; then
    NPM_TOKEN=$(cat ~/.npmrc.personal | grep "_authToken" | cut -d'=' -f2)
fi

if [ -z "$NPM_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Warning: No NPM_TOKEN found in .npmrc files${NC}"
    echo "Docker builds may fail for private packages"
fi

# Function to check if directory has Dockerfile
has_dockerfile() {
    [ -f "$1/Dockerfile" ]
}

# Function to run npm build
run_npm_build() {
    local dir=$1
    echo -e "${YELLOW}📦 Building $dir...${NC}"
    
    if [ -f "$dir/package.json" ]; then
        cd "$dir"
        if npm run build; then
            echo -e "${GREEN}✅ npm build successful for $dir${NC}"
            cd - > /dev/null
            return 0
        else
            echo -e "${RED}❌ npm build failed for $dir${NC}"
            cd - > /dev/null
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  No package.json found in $dir${NC}"
        return 0
    fi
}

# Function to run Docker build
run_docker_build() {
    local dir=$1
    local image_name=$(basename "$dir"):test
    
    echo -e "${YELLOW}🐳 Building Docker image for $dir...${NC}"
    
    if [ -n "$NPM_TOKEN" ]; then
        if docker build -f "$dir/Dockerfile" --build-arg NPM_TOKEN="$NPM_TOKEN" -t "$image_name" "$dir"; then
            echo -e "${GREEN}✅ Docker build successful for $dir${NC}"
            return 0
        else
            echo -e "${RED}❌ Docker build failed for $dir${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping Docker build for $dir (no NPM_TOKEN)${NC}"
        return 0
    fi
}

# Function to test Docker image (optional)
test_docker_image() {
    local dir=$1
    local image_name=$(basename "$dir"):test
    local port=$((3004 + $(echo "$dir" | wc -w)))
    
    echo -e "${YELLOW}🧪 Testing Docker image for $dir...${NC}"
    
    # Run container in background
    if docker run --rm -d -p "$((port+1)):$port" --name "test-$dir" "$image_name"; then
        # Wait for container to start
        sleep 5
        
        # Test if container is responding
        if curl -f --max-time 10 "http://localhost:$((port+1))/" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Docker image test successful for $dir${NC}"
            docker stop "test-$dir" > /dev/null 2>&1 || true
            return 0
        else
            echo -e "${YELLOW}⚠️  Docker image test failed for $dir (container not responding)${NC}"
            docker stop "test-$dir" > /dev/null 2>&1 || true
            return 1
        fi
    else
        echo -e "${RED}❌ Failed to start Docker container for $dir${NC}"
        return 1
    fi
}

# Track overall success
OVERALL_SUCCESS=true

# Process each changed directory
for dir in $CHANGED_DIRS; do
    if [ -d "$dir" ]; then
        echo -e "\n${YELLOW}🔍 Processing $dir...${NC}"
        
        # Run npm build
        if ! run_npm_build "$dir"; then
            OVERALL_SUCCESS=false
        fi
        
        # Run Docker build if Dockerfile exists
        if has_dockerfile "$dir"; then
            if ! run_docker_build "$dir"; then
                OVERALL_SUCCESS=false
            fi
            
            # Optional: Test Docker image
            if [ "$OVERALL_SUCCESS" = true ]; then
                test_docker_image "$dir" || true
            fi
        fi
    fi
done

# Final result
echo -e "\n${YELLOW}📋 Pre-push validation complete${NC}"

if [ "$OVERALL_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ All validations passed! Ready to push.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some validations failed. Please fix the errors before pushing.${NC}"
    echo -e "${RED}💡 To bypass this check, use: git push --no-verify${NC}"
    exit 1
fi
