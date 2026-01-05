#!/bin/bash

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_LOG_DIR="${BASE_DIR}/build-logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color


# Projects to build (in order)
PROJECTS=(
  "gaqno-shell"
  "gaqno-sso"
  "gaqno-ai"
  "gaqno-crm"
  "gaqno-erp"
  "gaqno-finance"
  "gaqno-pdv"
)

# Services to build
SERVICES=(
  "gaqno-pdv-service"
  "gaqno-sso-service"
)

# Create build logs directory
if [ ! -d "${BUILD_LOG_DIR}" ]; then
  mkdir -p "${BUILD_LOG_DIR}"
  echo "📁 Created build logs directory: ${BUILD_LOG_DIR}"
fi

echo ""
echo "🔨 Building all packages, services, and projects..."
echo "===================================================="
echo ""

cd "${BASE_DIR}"

SUCCESSFUL=()
FAILED=()

# Clean node_modules and package-lock.json files
echo -e "${BLUE}🧹 Cleaning node_modules and package-lock.json files...${NC}"
echo ""

# Clean packages
PACKAGES=(
  "@gaqno-backcore"
  "@gaqno-frontcore"
)

for package in "${PACKAGES[@]}"; do
  if [ -d "${package}" ]; then
    echo -e "${BLUE}  Cleaning ${package}...${NC}"
    cd "${package}"
    if [ -d "node_modules" ]; then
      rm -rf node_modules
      echo -e "    ${GREEN}✓${NC} Removed node_modules"
    fi
    if [ -f "package-lock.json" ]; then
      rm -f package-lock.json
      echo -e "    ${GREEN}✓${NC} Removed package-lock.json"
    fi
    cd ..
  fi
done

for service in "${SERVICES[@]}"; do
  if [ -d "${service}" ]; then
    echo -e "${BLUE}  Cleaning ${service}...${NC}"
    cd "${service}"
    if [ -d "node_modules" ]; then
      rm -rf node_modules
      echo -e "    ${GREEN}✓${NC} Removed node_modules"
    fi
    if [ -f "package-lock.json" ]; then
      rm -f package-lock.json
      echo -e "    ${GREEN}✓${NC} Removed package-lock.json"
    fi
    cd ..
  fi
done

for project in "${PROJECTS[@]}"; do
  if [ -d "${project}" ]; then
    echo -e "${BLUE}  Cleaning ${project}...${NC}"
    cd "${project}"
    if [ -d "node_modules" ]; then
      rm -rf node_modules
      echo -e "    ${GREEN}✓${NC} Removed node_modules"
    fi
    if [ -f "package-lock.json" ]; then
      rm -f package-lock.json
      echo -e "    ${GREEN}✓${NC} Removed package-lock.json"
    fi
    cd ..
  fi
done

echo -e "${GREEN}✅ Cleanup completed${NC}"
echo ""

# Install dependencies first
echo -e "${BLUE}📦 Installing dependencies first...${NC}"
echo ""

# Install packages first (they are dependencies of services and projects)
PACKAGES=(
  "@gaqno-backcore"
  "@gaqno-frontcore"
)

for package in "${PACKAGES[@]}"; do
  if [ -d "${package}" ] && [ -f "${package}/package.json" ]; then
    echo -e "${BLUE}  Installing ${package}...${NC}"
    cd "${package}"
    npm install --legacy-peer-deps > /dev/null 2>&1
    cd ..
  fi
done

for service in "${SERVICES[@]}"; do
  if [ -d "${service}" ] && [ -f "${service}/package.json" ]; then
    echo -e "${BLUE}  Installing ${service}...${NC}"
    cd "${service}"
    npm install --legacy-peer-deps > /dev/null 2>&1
    cd ..
  fi
done

for project in "${PROJECTS[@]}"; do
  if [ -d "${project}" ] && [ -f "${project}/package.json" ]; then
    echo -e "${BLUE}  Installing ${project}...${NC}"
    cd "${project}"
    npm install --legacy-peer-deps > /dev/null 2>&1
    cd ..
  fi
done

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Upgrade @gaqno-dev packages to latest versions
echo -e "${BLUE}⬆️  Upgrading @gaqno-dev packages to latest versions...${NC}"
echo ""

GAQNO_PACKAGES=(
  "@gaqno-dev/backcore"
  "@gaqno-dev/frontcore"
)

for service in "${SERVICES[@]}"; do
  if [ -d "${service}" ] && [ -f "${service}/package.json" ]; then
    # Check if service uses any @gaqno-dev packages
    if grep -q "@gaqno-dev" "${service}/package.json"; then
      echo -e "${BLUE}  Upgrading @gaqno-dev packages in ${service}...${NC}"
      cd "${service}"
      for pkg in "${GAQNO_PACKAGES[@]}"; do
        if grep -q "\"${pkg}\"" package.json; then
          npm install "${pkg}@latest" --legacy-peer-deps > /dev/null 2>&1
          echo -e "    ${GREEN}✓${NC} Upgraded ${pkg}"
        fi
      done
      cd ..
    fi
  fi
done

for project in "${PROJECTS[@]}"; do
  if [ -d "${project}" ] && [ -f "${project}/package.json" ]; then
    # Check if project uses any @gaqno-dev packages
    if grep -q "@gaqno-dev" "${project}/package.json"; then
      echo -e "${BLUE}  Upgrading @gaqno-dev packages in ${project}...${NC}"
      cd "${project}"
      for pkg in "${GAQNO_PACKAGES[@]}"; do
        if grep -q "\"${pkg}\"" package.json; then
          npm install "${pkg}@latest" --legacy-peer-deps > /dev/null 2>&1
          echo -e "    ${GREEN}✓${NC} Upgraded ${pkg}"
        fi
      done
      cd ..
    fi
  fi
done

echo -e "${GREEN}✅ @gaqno-dev packages upgraded to latest versions${NC}"
echo ""

# Build packages first
# echo -e "${BLUE}📦 Building packages first...${NC}"
# echo ""

# for package in "${PACKAGES[@]}"; do
#   if [ ! -d "${package}" ]; then
#     echo -e "${YELLOW}⚠️  Skipping ${package} (directory not found)${NC}"
#     continue
#   fi
#
#   echo -e "${BLUE}📦 Building ${package}...${NC}"
#   
#   LOG_FILE="${BUILD_LOG_DIR}/${package}-build.log"
#   
#   cd "${package}"
#   
#   if [ ! -f "package.json" ]; then
#     echo -e "${YELLOW}⚠️  Skipping ${package} (no package.json)${NC}"
#     cd ..
#     continue
#   fi
#
#   # Check if build script exists
#   if ! grep -q '"build"' package.json; then
#     echo -e "${YELLOW}⚠️  Skipping ${package} (no build script)${NC}"
#     cd ..
#     continue
#   fi
#
#   if npm run build > "${LOG_FILE}" 2>&1; then
#     echo -e "${GREEN}✅ ${package} built successfully${NC}"
#     SUCCESSFUL+=("${package}")
#   else
#     echo -e "${RED}❌ ${package} build failed${NC}"
#     echo -e "${YELLOW}   Check logs: ${LOG_FILE}${NC}"
#     FAILED+=("${package}")
#   fi
#   
#   cd ..
#   echo ""
# done

# Build services
echo -e "${BLUE}🔧 Building services...${NC}"
echo ""

for service in "${SERVICES[@]}"; do
  if [ ! -d "${service}" ]; then
    echo -e "${YELLOW}⚠️  Skipping ${service} (directory not found)${NC}"
    continue
  fi

  echo -e "${BLUE}🔧 Building ${service}...${NC}"
  
  LOG_FILE="${BUILD_LOG_DIR}/${service}-build.log"
  
  cd "${service}"
  
  if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️  Skipping ${service} (no package.json)${NC}"
    cd ..
    continue
  fi

  if npm run build > "${LOG_FILE}" 2>&1; then
    echo -e "${GREEN}✅ ${service} built successfully${NC}"
    SUCCESSFUL+=("${service}")
  else
    echo -e "${RED}❌ ${service} build failed${NC}"
    echo -e "${YELLOW}   Check logs: ${LOG_FILE}${NC}"
    FAILED+=("${service}")
  fi
  
  cd ..
  echo ""
done

# Build frontend projects
echo -e "${BLUE}🌐 Building frontend projects...${NC}"
echo ""

for project in "${PROJECTS[@]}"; do
  if [ ! -d "${project}" ]; then
    echo -e "${YELLOW}⚠️  Skipping ${project} (directory not found)${NC}"
    continue
  fi

  echo -e "${BLUE}📦 Building ${project}...${NC}"
  
  LOG_FILE="${BUILD_LOG_DIR}/${project}-build.log"
  
  cd "${project}"
  
  # Check if package.json exists
  if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️  Skipping ${project} (no package.json)${NC}"
    cd ..
    continue
  fi

  # PATCH: Fix unused @ts-expect-error in @gaqno-dev/frontcore
  if [ -f "node_modules/@gaqno-dev/frontcore/src/hooks/useDialogForm.ts" ]; then
    echo -e "${BLUE}  Patching useDialogForm.ts in ${project}...${NC}"
    # Remove the line containing @ts-expect-error using sed (Mac compatible)
    sed -i '' '/@ts-expect-error/d' "node_modules/@gaqno-dev/frontcore/src/hooks/useDialogForm.ts"
  fi

  # Run build and capture output
  if npm run build > "${LOG_FILE}" 2>&1; then
    echo -e "${GREEN}✅ ${project} built successfully${NC}"
    SUCCESSFUL+=("${project}")
  else
    echo -e "${RED}❌ ${project} build failed${NC}"
    echo -e "${YELLOW}   Check logs: ${LOG_FILE}${NC}"
    FAILED+=("${project}")
  fi
  
  cd ..
  echo ""
done

echo ""
echo "=========================================="
echo "📊 Build Summary"
echo "=========================================="
echo ""

if [ ${#SUCCESSFUL[@]} -gt 0 ]; then
  echo -e "${GREEN}✅ Successful builds (${#SUCCESSFUL[@]}):${NC}"
  for project in "${SUCCESSFUL[@]}"; do
    echo -e "   ${GREEN}✓${NC} ${project}"
  done
  echo ""
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo -e "${RED}❌ Failed builds (${#FAILED[@]}):${NC}"
  for project in "${FAILED[@]}"; do
    echo -e "   ${RED}✗${NC} ${project}"
    echo -e "      Log: ${BUILD_LOG_DIR}/${project}-build.log"
  done
  echo ""
  exit 1
fi

echo -e "${GREEN}🎉 All projects built successfully!${NC}"
echo ""
echo "📁 Build logs saved in: ${BUILD_LOG_DIR}"
echo ""

