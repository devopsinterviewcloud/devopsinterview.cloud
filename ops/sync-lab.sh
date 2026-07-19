#!/usr/bin/env bash

set -euo pipefail

LAB_SOURCE_DIR="${LAB_SOURCE_DIR:-/home/ubuntu/kimi}"
SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAB_DIST_DIR="${LAB_SOURCE_DIR}/dist-labs"
LAB_PUBLIC_DIR="${SITE_ROOT}/public/labs/token-cost"

if [[ ! -f "${LAB_SOURCE_DIR}/package.json" ]]; then
  echo "Lab source not found at ${LAB_SOURCE_DIR}. Set LAB_SOURCE_DIR and try again." >&2
  exit 1
fi

command -v npx >/dev/null || { echo "npx is required to build the lab." >&2; exit 1; }
command -v rsync >/dev/null || { echo "rsync is required to publish the lab." >&2; exit 1; }

(
  cd "${LAB_SOURCE_DIR}"
  npx vite build --base=/labs/token-cost/ --outDir dist-labs
)

mkdir -p "${LAB_PUBLIC_DIR}"
rsync -a --delete "${LAB_DIST_DIR}/" "${LAB_PUBLIC_DIR}/"

echo "Incident Lab synced to ${LAB_PUBLIC_DIR}"
