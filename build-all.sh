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
  "gaqno-dropshipping"
  "gaqno-dropshipping-admin-ui"
  "gaqno-erp-ui"
  "gaqno-finance-ui"
  "gaqno-intelligence-ui"
  "gaqno-landing-ui"
  "gaqno-lenin-ui"
  "gaqno-omnichannel-ui"
  "gaqno-pdv-ui"
  "gaqno-rpg-ui"
  "gaqno-shell-ui"
  "gaqno-sherlock-ui"
  "gaqno-shop"
  "gaqno-shop-admin"
  "gaqno-sso-ui"
  "gaqno-wellness-ui"
)

SERVICES=(
  "gaqno-admin-service"
  "gaqno-ai-service"
  "gaqno-consumer-service"
  "gaqno-crm-service"
  "gaqno-customer-service"
  "gaqno-dropshipping-service"
  "gaqno-erp-service"
  "gaqno-finance-service"
  "gaqno-intelligence-service"
  "gaqno-lead-enrichment-service"
  "gaqno-omnichannel-service"
  "gaqno-pdv-service"
  "gaqno-rpg-service"
  "gaqno-sherlock-service"
  "gaqno-shop-service"
  "gaqno-sso-service"
  "gaqno-wellness-service"
)

DOCKER_EXTRA_ARGS=""
FILTERS=()
for arg in "$@"; do
  case "${arg}" in
    --no-cache) DOCKER_EXTRA_ARGS="${DOCKER_EXTRA_ARGS} --no-cache" ;;
    *) FILTERS+=("${arg}") ;;
  esac
done

for flt in "${FILTERS[@]}"; do
  FOUND=0
  for s in "${SERVICES[@]}"; do [ "${s}" = "${flt}" ] && FOUND=1; done
  for p in "${PROJECTS[@]}"; do [ "${p}" = "${flt}" ] && FOUND=1; done
  if [ "${FOUND}" -eq 0 ]; then
    echo -e "${RED}❌ Unknown project: ${flt}${NC}"
    echo ""
    echo "Available services:"
    printf "   %s\n" "${SERVICES[@]}"
    echo ""
    echo "Available frontend projects:"
    printf "   %s\n" "${PROJECTS[@]}"
    exit 1
  fi
done

HAS_FILTER=$(( ${#FILTERS[@]} > 0 ? 1 : 0 ))

matches_filter() {
  [ "${HAS_FILTER}" -eq 0 ] && return 0
  local name="$1"
  for flt in "${FILTERS[@]}"; do
    [ "${flt}" = "${name}" ] && return 0
  done
  return 1
}

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
if [ "${HAS_FILTER}" -eq 1 ]; then
  echo "🐳 Building ${FILTERS[*]} with Docker..."
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
    --build-arg GAQNO_CACHE_BUST="$(date +%s)" \
    ${DOCKER_EXTRA_ARGS} \
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
    matches_filter "${service}" || continue
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
    matches_filter "${project}" || continue
    if [ -f "${BASE_DIR}/${project}/Dockerfile.monorepo" ]; then
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

echo -e "${BLUE}📦 Generating codemap.json for admin-service...${NC}"
if npm run codemap --silent > /dev/null 2>&1 && [ -f "${BASE_DIR}/codemap.json" ]; then
  cp "${BASE_DIR}/codemap.json" "${BASE_DIR}/gaqno-admin-service/codemap.json"
  echo -e "${GREEN}✅ codemap.json generated and copied${NC}"
else
  echo -e "${YELLOW}⚠️  codemap.json generation skipped (script missing or failed)${NC}"
fi
echo ""

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

if [ "${HAS_FILTER}" -eq 1 ]; then
  echo -e "${GREEN}🎉 ${FILTERS[*]} built successfully!${NC}"
else
  echo -e "${GREEN}🎉 All Docker builds completed successfully!${NC}"
fi
echo ""
echo "📁 Build logs: ${BUILD_LOG_DIR}"
echo ""
