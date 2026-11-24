#!/usr/bin/env bash
# Re-runs when workspace content updates (e.g. lockfile changes after rebuild).
set -euo pipefail

ROOT="${containerWorkspaceFolder:-$(pwd)}"
cd "${ROOT}"

if [[ -f web/package.json ]]; then
	echo "Updating web/ dependencies with pnpm…"
	(cd web && pnpm install)
fi

if command -v uv >/dev/null 2>&1 && [[ -f python/pyproject.toml ]]; then
	echo "Updating Python CLI with uv…"
	(cd python && uv sync)
fi

echo "updateContent finished."
