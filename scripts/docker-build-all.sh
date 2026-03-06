#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
ROOT="$PWD"

if [ -f .npmrc ]; then
  NPM_TOKEN=$(grep "_authToken" .npmrc | cut -d'=' -f2)
else
  NPM_TOKEN=""
fi

# Auto-discover all Dockerfiles so new services are always included
DOCKERFILES=()
while IFS= read -r -d '' f; do
  DOCKERFILES+=( "$f" )
done < <(find . -name Dockerfile -not -path './node_modules/*' -print0 | sort -z)

TAG="${1:-test}"

for DF in "${DOCKERFILES[@]}"; do
  DF="${DF#./}"
  [ -f "$ROOT/$DF" ] || { echo "Skip (missing): $DF"; continue; }
  DIR="${DF%/Dockerfile}"
  NAME="${DIR//\//-}"
  echo "Building $NAME:$TAG (context: $DIR)"
  if [ -n "$NPM_TOKEN" ]; then
    docker build -f "$ROOT/$DF" --build-arg NPM_TOKEN="$NPM_TOKEN" -t "${NAME}:${TAG}" "$ROOT/$DIR"
  else
    docker build -f "$ROOT/$DF" -t "${NAME}:${TAG}" "$ROOT/$DIR"
  fi
done

echo "Done. All images tagged with :$TAG"
