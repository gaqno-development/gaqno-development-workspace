#!/bin/bash

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_LOG_DIR="${BASE_DIR}/build-logs"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECTS=(
  "gaqno-admin-ui"
  "gaqno-ai-ui"
  "gaqno-consumer-ui"
  "gaqno-crm-ui"
  "gaqno-docs-ui"
  "gaqno-erp-ui"
  "gaqno-finance-ui"
  "gaqno-intelligence-ui"
  "gaqno-landing-ui"
  "gaqno-lenin-ui"
  "gaqno-omnichannel-ui"
  "gaqno-pdv-ui"
  "gaqno-rpg-ui"
  "gaqno-shell-ui"
  "gaqno-sso-ui"
  "gaqno-wellness-ui"
)

SERVICES=(
  "gaqno-admin-service"
  "gaqno-ai-service"
  "gaqno-consumer-service"
  "gaqno-crm-service"
  "gaqno-customer-service"
  "gaqno-erp-service"
  "gaqno-finance-service"
  "gaqno-intelligence-service"
  "gaqno-lead-enrichment-service"
  "gaqno-omnichannel-service"
  "gaqno-pdv-service"
  "gaqno-rpg-service"
  "gaqno-sso-service"
  "gaqno-wellness-service"
)

FILTER="$1"

if [ -n "${FILTER}" ]; then
  FOUND=0
  for s in "${SERVICES[@]}"; do [ "${s}" = "${FILTER}" ] && FOUND=1; done
  for p in "${PROJECTS[@]}"; do [ "${p}" = "${FILTER}" ] && FOUND=1; done
  if [ "${FOUND}" -eq 0 ]; then
    echo -e "${RED}❌ Unknown project: ${FILTER}${NC}"
    echo ""
    echo "Available services:"
    printf "   %s\n" "${SERVICES[@]}"
    echo ""
    echo "Available frontend projects:"
    printf "   %s\n" "${PROJECTS[@]}"
    exit 1
  fi
fi

if [ ! -d "${BUILD_LOG_DIR}" ]; then
  mkdir -p "${BUILD_LOG_DIR}"
  echo "📁 Created build logs directory: ${BUILD_LOG_DIR}"
fi

NPM_TOKEN=""
if [ -f "${BASE_DIR}/.npmrc" ]; then
  NPM_TOKEN=$(grep "_authToken" "${BASE_DIR}/.npmrc" 2>/dev/null | cut -d'=' -f2)
fi
if [ -z "${NPM_TOKEN}" ] && [ -f "${HOME}/.npmrc.personal" ]; then
  NPM_TOKEN=$(grep "_authToken" "${HOME}/.npmrc.personal" 2>/dev/null | cut -d'=' -f2)
fi
if [ -z "${NPM_TOKEN}" ]; then
  echo -e "${YELLOW}⚠️  NPM_TOKEN not found in .npmrc or ~/.npmrc.personal; Docker builds may fail for private packages.${NC}"
fi

echo ""
if [ -n "${FILTER}" ]; then
  echo "🐳 Building ${FILTER} with Docker..."
else
  echo "🐳 Building all projects and services with Docker..."
fi
echo "===================================================="
echo ""

cd "${BASE_DIR}"

SUCCESSFUL=()
FAILED=()

docker_build_one() {
  local name="$1"
  local dir="$2"
  local context="${3:-${dir}}"
  local dockerfile="${4:-${dir}/Dockerfile}"
  local log_file="${BUILD_LOG_DIR}/${name}-docker-build.log"

  if [ ! -d "${dir}" ]; then
    echo -e "${YELLOW}⚠️  Skipping ${name} (directory not found)${NC}"
    return 1
  fi
  if [ ! -f "${dockerfile}" ]; then
    echo -e "${YELLOW}⚠️  Skipping ${name} (no Dockerfile at ${dockerfile})${NC}"
    return 1
  fi

  echo -e "${BLUE}🐳 Building ${name}...${NC}"
  if docker build -f "${dockerfile}" \
    --build-arg NPM_TOKEN="${NPM_TOKEN}" \
    -t "${name}:test" \
    "${context}" > "${log_file}" 2>&1; then
    echo -e "${GREEN}✅ ${name} built successfully${NC}"
    return 0
  else
    echo -e "${RED}❌ ${name} Docker build failed${NC}"
    echo -e "${YELLOW}   Log: ${log_file}${NC}"
    return 1
  fi
}

build_services() {
  echo -e "${BLUE}🔧 Building services...${NC}"
  echo ""
  for service in "${SERVICES[@]}"; do
    [ -n "${FILTER}" ] && [ "${service}" != "${FILTER}" ] && continue
    if docker_build_one "${service}" "${service}"; then
      SUCCESSFUL+=("${service}")
    else
      FAILED+=("${service}")
    fi
    echo ""
  done
}

build_frontends() {
  echo -e "${BLUE}🌐 Building frontend projects...${NC}"
  echo ""
  for project in "${PROJECTS[@]}"; do
    [ -n "${FILTER}" ] && [ "${project}" != "${FILTER}" ] && continue
    if [ "${project}" = "gaqno-erp-ui" ]; then
      if docker_build_one "${project}" "${project}" "${BASE_DIR}" "${project}/Dockerfile.monorepo"; then
        SUCCESSFUL+=("${project}")
      else
        FAILED+=("${project}")
      fi
    else
      if docker_build_one "${project}" "${project}"; then
        SUCCESSFUL+=("${project}")
      else
        FAILED+=("${project}")
      fi
    fi
    echo ""
  done
}

build_services
build_frontends

echo ""
echo "=========================================="
echo "📊 Build Summary"
echo "=========================================="
echo ""

if [ ${#SUCCESSFUL[@]} -gt 0 ]; then
  echo -e "${GREEN}✅ Successful Docker builds (${#SUCCESSFUL[@]}):${NC}"
  for item in "${SUCCESSFUL[@]}"; do
    echo -e "   ${GREEN}✓${NC} ${item}"
  done
  echo ""
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo -e "${RED}❌ Failed Docker builds (${#FAILED[@]}):${NC}"
  for item in "${FAILED[@]}"; do
    echo -e "   ${RED}✗${NC} ${item}"
    echo -e "      Log: ${BUILD_LOG_DIR}/${item}-docker-build.log"
  done
  echo ""
  exit 1
fi

if [ -n "${FILTER}" ]; then
  echo -e "${GREEN}🎉 ${FILTER} built successfully!${NC}"
else
  echo -e "${GREEN}🎉 All Docker builds completed successfully!${NC}"
fi
echo ""
echo "📁 Build logs: ${BUILD_LOG_DIR}"
echo ""
