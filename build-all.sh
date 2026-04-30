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
  "gaqno-mastra"
  "gaqno-omnichannel-service"
  "gaqno-pdv-service"
  "gaqno-rpg-service"
  "gaqno-sherlock-service"
  "gaqno-shop-service"
  "gaqno-sso-service"
  "gaqno-wellness-service"
)

DOCKER_EXTRA_ARGS=""
BUST_CACHE=0
MAX_PARALLEL="${MAX_PARALLEL:-4}"
FILTERS=()
for arg in "$@"; do
  case "${arg}" in
    --no-cache) DOCKER_EXTRA_ARGS="${DOCKER_EXTRA_ARGS} --no-cache"; BUST_CACHE=1 ;;
    --parallel=*) MAX_PARALLEL="${arg#--parallel=}" ;;
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

NPM_TOKEN="${NPM_TOKEN:-}"
if [ -z "${NPM_TOKEN}" ]; then
  NPM_TOKEN=$("${BASE_DIR}/gaqno-resolve-npm-token.sh" "${BASE_DIR}" 2>/dev/null) || true
fi
if [ -z "${NPM_TOKEN}" ]; then
  echo -e "${YELLOW}⚠️  NPM_TOKEN not found (export NPM_TOKEN, workspace .env, workspace .npmrc, ~/.npmrc.personal, .cursor/mcp.json, Dokploy API, or gaqno-*/.npmrc); Docker builds may fail for private packages.${NC}"
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

SUCCESSFUL_FILE="$(mktemp)"
FAILED_FILE="$(mktemp)"
RUNNING_FILE="$(mktemp)"
trap 'rm -f "${SUCCESSFUL_FILE}" "${FAILED_FILE}" "${RUNNING_FILE}"' EXIT

record_success() { echo "$1" >> "${SUCCESSFUL_FILE}"; }
record_failure() { echo "$1" >> "${FAILED_FILE}"; }
record_start()   { echo "$1" >> "${RUNNING_FILE}"; }
record_done()    { sed -i'' -e "/^${1}$/d" "${RUNNING_FILE}" 2>/dev/null; }

format_duration() {
  local secs="$1"
  if [ "${secs}" -ge 60 ]; then
    printf "%dm%02ds" $((secs / 60)) $((secs % 60))
  else
    printf "%ds" "${secs}"
  fi
}

CACHE_BUST_ARGS=""
if [ "${BUST_CACHE}" -eq 1 ]; then
  CACHE_BUST_ARGS="--build-arg GAQNO_CACHE_BUST=$(date +%s)"
fi

short_name() {
  echo "$1" | sed 's/^gaqno-//'
}

docker_build_one() {
  local name="$1"
  local dir="$2"
  local context="${3:-${dir}}"
  local dockerfile="${4:-${dir}/Dockerfile}"
  local log_file="${BUILD_LOG_DIR}/${name}-docker-build.log"
  local tag
  tag=$(short_name "${name}")

  if [ ! -d "${dir}" ]; then
    echo -e "${YELLOW}⚠️  Skipping ${name} (directory not found)${NC}"
    return 1
  fi
  if [ ! -f "${dockerfile}" ]; then
    echo -e "${YELLOW}⚠️  Skipping ${name} (no Dockerfile at ${dockerfile})${NC}"
    return 1
  fi

  local start_ts
  start_ts=$(date +%s)
  echo -e "${BLUE}🐳 [${tag}] Building...${NC}"
  local exit_code
  (
    set -o pipefail 2>/dev/null || true
    docker build -f "${dockerfile}" \
      --build-arg NPM_TOKEN="${NPM_TOKEN}" \
      ${CACHE_BUST_ARGS} \
      ${DOCKER_EXTRA_ARGS} \
      -t "${name}:test" \
      "${context}" 2>&1 | tee "${log_file}" | sed -u "s/^/  ${BLUE}[${tag}]${NC} /"
  )
  exit_code=$?

  local elapsed
  elapsed=$(( $(date +%s) - start_ts ))
  if [ "${exit_code}" -eq 0 ]; then
    echo -e "${GREEN}✅ [${tag}] Built successfully ($(format_duration ${elapsed}))${NC}"
    return 0
  else
    echo -e "${RED}❌ [${tag}] Build failed ($(format_duration ${elapsed}))${NC}"
    echo -e "${YELLOW}   Log: ${log_file}${NC}"
    return 1
  fi
}

wait_for_slots() {
  while [ "$(jobs -rp | wc -l)" -ge "${MAX_PARALLEL}" ]; do
    wait -n 2>/dev/null || true
  done
}

build_item() {
  trap - EXIT 2>/dev/null || true
  local name="$1"
  local dir="$2"
  local context="$3"
  local dockerfile="$4"
  record_start "${name}"
  if docker_build_one "${name}" "${dir}" "${context}" "${dockerfile}"; then
    record_success "${name}"
  else
    record_failure "${name}"
  fi
  record_done "${name}"
}

show_remaining() {
  local remaining
  remaining=$(cat "${RUNNING_FILE}" 2>/dev/null | grep -c .)
  if [ "${remaining}" -gt 0 ]; then
    echo -e "${BLUE}⏳ Waiting for ${remaining} build(s): $(paste -sd', ' "${RUNNING_FILE}")${NC}"
  fi
}

build_services() {
  echo -e "${BLUE}🔧 Building services...${NC}"
  echo ""
  for service in "${SERVICES[@]}"; do
    matches_filter "${service}" || continue
    wait_for_slots
    build_item "${service}" "${service}" "" "" &
  done
}

build_frontends() {
  echo -e "${BLUE}🌐 Building frontend projects...${NC}"
  echo ""
  for project in "${PROJECTS[@]}"; do
    matches_filter "${project}" || continue
    wait_for_slots
    if [ -f "${BASE_DIR}/${project}/Dockerfile.monorepo" ]; then
      build_item "${project}" "${project}" "${BASE_DIR}" "${project}/Dockerfile.monorepo" &
    else
      build_item "${project}" "${project}" "" "" &
    fi
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
show_remaining
wait

mapfile -t SUCCESSFUL < "${SUCCESSFUL_FILE}" 2>/dev/null || true
mapfile -t FAILED < "${FAILED_FILE}" 2>/dev/null || true

echo ""
echo "=========================================="
echo "📊 Build Summary (parallel=${MAX_PARALLEL})"
echo "=========================================="
echo ""

if [ ${#SUCCESSFUL[@]} -gt 0 ]; then
  echo -e "${GREEN}✅ Successful Docker builds (${#SUCCESSFUL[@]}):${NC}"
  for item in "${SUCCESSFUL[@]}"; do
    echo -e "   ${GREEN}✓${NC} ${item}"
  done
  echo ""
fi

if [ "${HAS_FILTER}" -eq 1 ] && [ ${#SUCCESSFUL[@]} -eq 0 ] && [ ${#FAILED[@]} -eq 0 ]; then
  echo -e "${RED}❌ No build result recorded for: ${FILTERS[*]} (internal error or jobs did not run).${NC}"
  exit 1
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
