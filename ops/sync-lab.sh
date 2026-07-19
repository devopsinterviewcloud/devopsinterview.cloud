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

# Vite owns the lab build, while production URL metadata belongs to this site.
# Keep this post-build step in sync with public/labs/token-cost/index.html so a
# future lab rebuild cannot remove or replace the canonical/social metadata.
LAB_INDEX="${LAB_PUBLIC_DIR}/index.html"
SEO_DESCRIPTION="Investigate an LLM token-cost spike in a free browser-based incident lab. Inspect evidence, test hypotheses, identify the root cause, and write a postmortem."

sed -i -E \
  '/<!-- Production SEO: maintained by ops\/sync-lab.sh -->/,/<!-- End production SEO -->/d; /<link rel="canonical"/d; /<meta property="og:/d; /<meta name="twitter:/d' \
  "${LAB_INDEX}"
sed -i -E 's#<title>[^<]*</title>#<title>LLM Token Cost Incident Lab | DevOps Troubleshooting</title>#' "${LAB_INDEX}"

if grep -q '<meta name="description"' "${LAB_INDEX}"; then
  sed -i -E "s#<meta name=\"description\" content=\"[^\"]*\" ?/?>#<meta name=\"description\" content=\"${SEO_DESCRIPTION}\" />#" "${LAB_INDEX}"
else
  sed -i "/<title>/i\\    <meta name=\"description\" content=\"${SEO_DESCRIPTION}\" />" "${LAB_INDEX}"
fi

sed -i '/<title>/a\
    <!-- Production SEO: maintained by ops/sync-lab.sh -->\
    <link rel="canonical" href="https://devopsinterview.cloud/labs/token-cost" />\
    <meta property="og:type" content="website" />\
    <meta property="og:site_name" content="DevOpsInterview.Cloud" />\
    <meta property="og:title" content="LLM Token Cost Incident Lab | DevOps Troubleshooting" />\
    <meta property="og:description" content="Investigate an LLM token-cost spike, test hypotheses, identify the root cause, and write a postmortem in this free interactive lab." />\
    <meta property="og:url" content="https://devopsinterview.cloud/labs/token-cost" />\
    <meta property="og:image" content="https://devopsinterview.cloud/og-image.jpg" />\
    <meta property="og:image:width" content="1200" />\
    <meta property="og:image:height" content="630" />\
    <meta property="og:image:alt" content="DevOpsInterview.Cloud token-cost incident lab" />\
    <meta name="twitter:card" content="summary_large_image" />\
    <meta name="twitter:title" content="LLM Token Cost Incident Lab | DevOps Troubleshooting" />\
    <meta name="twitter:description" content="Investigate an LLM token-cost spike, test hypotheses, identify the root cause, and write a postmortem in this free interactive lab." />\
    <meta name="twitter:image" content="https://devopsinterview.cloud/og-image.jpg" />\
    <!-- End production SEO -->' "${LAB_INDEX}"

echo "Incident Lab synced to ${LAB_PUBLIC_DIR}"
