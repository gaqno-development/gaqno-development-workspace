#!/bin/bash

# Setup script for build validation hooks
# This script configures git hooks to ensure builds are validated before push

set -e

echo "🔧 Setting up build validation hooks..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get the repository root directory
REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
SCRIPTS_DIR="$REPO_ROOT/scripts"

# Ensure scripts directory exists
mkdir -p "$SCRIPTS_DIR"

# Create pre-push validation script if it doesn't exist
PRE_PUSH_SCRIPT="$SCRIPTS_DIR/pre-push-validation.sh"
if [ ! -f "$PRE_PUSH_SCRIPT" ]; then
    echo -e "${YELLOW}📝 Creating pre-push validation script...${NC}"
    
    cat > "$PRE_PUSH_SCRIPT" << 'EOF'
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

# Get changed directories
CHANGED_DIRS=$(git diff --cached --name-only | grep -E "^[^/]+/[^/]+/" | cut -d'/' -f1 | sort -u)

# Get NPM token
NPM_TOKEN=""
if [ -f ".npmrc" ]; then
    NPM_TOKEN=$(cat .npmrc | grep "_authToken" | cut -d'=' -f2)
elif [ -f "$HOME/.npmrc.personal" ]; then
    NPM_TOKEN=$(cat "$HOME/.npmrc.personal" | grep "_authToken" | cut -d'=' -f2)
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
EOF

    chmod +x "$PRE_PUSH_SCRIPT"
    echo -e "${GREEN}✅ Created pre-push validation script${NC}"
else
    echo -e "${GREEN}✅ Pre-push validation script already exists${NC}"
fi

# Create git hook
PRE_PUSH_HOOK="$HOOKS_DIR/pre-push"
cat > "$PRE_PUSH_HOOK" << EOF
#!/bin/sh

# Git pre-push hook
# This hook is called by git push -- and can be used to prevent a push from happening.

# Get the directory where this script is located
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PRE_PUSH_SCRIPT="\$SCRIPT_DIR/../scripts/pre-push-validation.sh"

# Check if the validation script exists and is executable
if [ -f "\$PRE_PUSH_SCRIPT" ] && [ -x "\$PRE_PUSH_SCRIPT" ]; then
    echo "🔧 Running pre-push validation..."
    exec "\$PRE_PUSH_SCRIPT"
else
    echo "⚠️  Pre-push validation script not found or not executable"
    echo "💡 To install: chmod +x scripts/pre-push-validation.sh"
    echo "🚀 Proceeding with push without validation..."
    exit 0
fi
EOF

chmod +x "$PRE_PUSH_HOOK"

echo -e "${GREEN}✅ Git pre-push hook installed${NC}"

# Create a manual validation script
MANUAL_SCRIPT="$SCRIPTS_DIR/validate-build.sh"
cat > "$MANUAL_SCRIPT" << 'EOF'
#!/bin/bash

# Manual build validation script
# Use this to validate builds without pushing

set -e

echo "🔍 Running manual build validation..."

# Get all directories with package.json
DIRS=$(find . -name "package.json" -not -path "./node_modules/*" -not -path "./.git/*" | dirname {} | sort)

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
EOF

chmod +x "$MANUAL_SCRIPT"
echo -e "${GREEN}✅ Created manual validation script: scripts/validate-build.sh${NC}"

echo -e "\n${GREEN}🎉 Build validation setup complete!${NC}"
echo -e "${YELLOW}📋 Available commands:${NC}"
echo -e "  ${YELLOW}• git push${NC}           - Will run validation automatically"
echo -e "  ${YELLOW}• git push --no-verify${NC} - Bypass validation (not recommended)"
echo -e "  ${YELLOW}• ./scripts/validate-build.sh${NC} - Manual validation without pushing"
echo -e "\n${YELLOW}⚙️  Configuration:${NC}"
echo -e "  ${YELLOW}• Ensure NPM_TOKEN is available in .npmrc or ~/.npmrc.personal${NC}"
echo -e "  ${YELLOW}• Docker builds will run for any directory with Dockerfile${NC}"
echo -e "  ${YELLOW}• npm build will run for any directory with package.json${NC}"
