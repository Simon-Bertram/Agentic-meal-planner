#!/usr/bin/env bash
# Runs once after the container is created (named volumes may be root-owned).
set -euo pipefail

ROOT="${containerWorkspaceFolder:-$(pwd)}"
cd "${ROOT}"

mkdir -p web/node_modules web/.wrangler \
	/home/node/.local/share/pnpm/store \
	/home/node/.local/share/uv/python

# Microsoft javascript-node image: node has NOPASSWD sudo
sudo chown -R node:node \
	"${ROOT}/web/node_modules" \
	"${ROOT}/web/.wrangler" \
	/home/node/.local

if [[ -f web/package.json ]]; then
	echo "Installing web/ dependencies with pnpm…"
	(cd web && pnpm install)
fi

if command -v uv >/dev/null 2>&1 && [[ -f python/pyproject.toml ]]; then
	echo "Syncing Python CLI with uv (CPython from python/.python-version)…"
	(cd python && uv sync)
fi

echo "postCreate finished."
