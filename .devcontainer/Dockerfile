# syntax=docker/dockerfile:1
# Requires BuildKit (DOCKER_BUILDKIT=1). Apt cache mounts fail if BuildKit is off.
# Node 24 = Maintenance LTS as of late 2026; stay here unless Astro/workerd need newer.

# --- STAGE 1: BASE ---
FROM mcr.microsoft.com/devcontainers/javascript-node:24-bookworm AS base

# Keep python3/make/g++ for node-gyp only (bookworm python3 ≠ project CLI).
# Add libvips-dev later only if sharp is a real dependency.
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
	--mount=type=cache,target=/var/lib/apt,sharing=locked \
	apt-get update && export DEBIAN_FRONTEND=noninteractive \
	&& apt-get install -y --no-install-recommends \
		git curl ca-certificates openssl bash-completion \
		python3 make g++ \
	&& apt-get clean

# uv for the python/ CLI (downloads CPython 3.15 via python/.python-version)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh \
	&& mv /root/.local/bin/uv /usr/local/bin/uv \
	&& mv /root/.local/bin/uvx /usr/local/bin/uvx

# Pin pnpm to match web/package.json packageManager (Corepack must stay in sync).
# Do NOT set global CI=1 — pnpm refuses outdated lockfiles and Astro/Vite change
# behavior under CI. Keep Corepack non-interactive instead.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV PNPM_VERSION=11.29.0

RUN npm uninstall -g pnpm || true \
	&& corepack enable \
	&& corepack prepare "pnpm@${PNPM_VERSION}" --activate

ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PNPM_STORE_DIR="/home/node/.local/share/pnpm/store"
ENV PATH="${PNPM_HOME}:${PNPM_HOME}/bin:${PATH}"
# uv installs project Python here (writable by remoteUser node)
ENV UV_PYTHON_INSTALL_DIR="/home/node/.local/share/uv/python"

RUN mkdir -p /home/node/.local/share/pnpm/store \
	/home/node/.local/share/uv/python \
	&& chown -R node:node /home/node/.local

# --- STAGE 2: DEV (Dev Container target) ---
FROM base AS dev
WORKDIR /workspaces

# Named volumes (node_modules, .wrangler, pnpm store) are mounted at
# runtime and owned via postCreateCommand — image chown cannot fix those paths.
# Microsoft image grants node NOPASSWD sudo for that chown step.
USER node
