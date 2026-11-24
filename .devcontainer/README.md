# Dev Container (meal planner)

Debian + **Node 24** (Maintenance LTS) + **pnpm 11.29.0** (Corepack) + **uv** for the `python/` CLI. Daily app URL is **http://localhost:4321** (`astro dev` / workerd). Port **8787** is for `wrangler dev` / `astro preview` only.

## Reopen in Container

1. Install Docker Desktop and the Dev Containers extension (Cursor / VS Code).
2. Command Palette → **Dev Containers: Reopen in Container**.
3. First create runs `post-create.sh` (chown named volumes, optional `pnpm install` / `uv sync`).

Verify:

```bash
node -v    # v24.x
pnpm -v    # 11.29.0
uv --version
```

## Secrets

| Secret | Where | Used by |
|--------|--------|---------|
| `GEMINI_API_KEY`, Turnstile keys | `web/.dev.vars` (gitignored; copy from `web/.dev.vars.example`) | Astro / Wrangler / Miniflare Worker bindings |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Host env → `containerEnv` | Wrangler CLI deploy / KV create only |
| OpenAI key (Python CLI) | `python/.env` (see `python/.env.example`) | `cd python && uv run meal-planner` |

Worker bindings do **not** read `containerEnv`. Putting `GEMINI_API_KEY` in `containerEnv` would expose it to every shell and agent via `printenv` without helping `astro dev`. Prefer:

```bash
cp web/.dev.vars.example web/.dev.vars
# edit GEMINI_API_KEY=…
```

For deploy from the container, either export Cloudflare vars on the host before reopen, or run `pnpm exec wrangler login`.

## Python CLI (3.15)

Bookworm’s `/usr/bin/python3` is for **node-gyp only**. The Codecademy CLI uses **uv-managed CPython 3.15** from [`python/.python-version`](../python/.python-version):

```bash
cd python
uv sync
uv run meal-planner
```

`UV_PYTHON_INSTALL_DIR` is `/home/node/.local/share/uv/python` so installs stay writable as `remoteUser: node`.

## pnpm store & volumes

Per-repo named volumes (avoids cross-project store layout clashes):

- `${folder}-web-node_modules` → `web/node_modules`
- `${folder}-pnpm-store` → `/home/node/.local/share/pnpm/store`
- `${folder}-wrangler-local-state` → `web/.wrangler`

`PNPM_STORE_DIR` is set in the image and `devcontainer.json`. When you scaffold `web/`, add [`web/.npmrc`](../web/.npmrc) (see Phase B below) so the store path cannot drift.

Do **not** set global `CI=1` in the image — pnpm then refuses an outdated lockfile and Astro/Vite change behavior.

## Phase B — scaffold `web/` (pnpm only)

Do **not** use `npm create` / `npx` (they drop `package-lock.json`). Inside the container:

```bash
# Astro + Cloudflare Workers (adjust flags to match current C3 prompts)
pnpm create cloudflare@latest web -- --framework=astro

cd web
# packageManager must match Dockerfile PNPM_VERSION
# "packageManager": "pnpm@11.29.0"

# Allow native install scripts (names must match real packages)
# In pnpm-workspace.yaml or via: pnpm approve-builds
# allowBuilds: esbuild, workerd (+ sharp only if installed)

cp ../.devcontainer/npmrc.web.example .npmrc

pnpm add -D ultracite
pnpm dlx ultracite@latest init --linter biome

pnpm install
pnpm exec wrangler types
pnpm dev          # http://localhost:4321
```

KV namespaces are **not** created by the Dev Container. After `wrangler.jsonc` exists:

```bash
pnpm exec wrangler kv namespace create MEAL_PLANNER_QUOTAS
pnpm exec wrangler kv namespace create MEAL_PLANNER_QUOTAS --preview
# paste id + preview_id into wrangler.jsonc
```

## HMR on macOS bind mounts

`web/node_modules` lives on a named volume (good for perf). If Vite/Astro file watches miss edits on the bind-mounted source, set `server.watch.usePolling` in the Vite/Astro config — do not enable polling globally on day one.

## Formatting

Biome (Ultracite) is the default formatter. `.astro` files use the Astro extension formatter so Biome and the editor do not fight.
