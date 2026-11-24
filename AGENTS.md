# AGENTS.md — Meal Planner

Engineering playbook for AI agents working in this repo.

Product features and limits: see [PRD.md](PRD.md).  
Dev Container setup details: see [.devcontainer/README.md](.devcontainer/README.md).

## Repo snapshot

Two products share one repo:

| Area | Role | Stack |
|------|------|--------|
| `python/` | Codecademy Python CLI / reference | Python 3.15, `uv`, OpenAI `gpt-4o` |
| `web/` | Production web app (planned; not scaffolded yet) | Astro + Preact, pnpm, Gemini on one Cloudflare Worker |

When building the web app, **leave the Python package untouched** — do not convert or delete it. Mirror its behavior in TypeScript under `web/` instead.

## Layout

- `python/` — uv project root (`src/meal_planner/`, `pyproject.toml`, `.env`, study docs)
- `web/` — Astro app root (volumes for `node_modules` / `.wrangler` already exist; no app yet)
- `.devcontainer/` — Node 24 + pinned pnpm + uv

## Python CLI (current)

```bash
cd python
uv sync
uv run python src/meal_planner/build_plan.py   # real pipeline
uv run python src/meal_planner/meal_plan.py    # draft only
uv run meal-planner                            # stub — not the pipeline
```

- Always use **uv-managed Python 3.15** from [`python/.python-version`](python/.python-version).
- **Never** use `/usr/bin/python3` (Bookworm 3.11 is for **node-gyp only**).
- Secrets: [`python/.env`](python/.env.example) → `OPENAI_API_KEY` (see [python/docs/env-and-dotenv.md](python/docs/env-and-dotenv.md)).
- Conventions: keep constraints in `user_inputs.py`; planners take that dict; snake_case keys (`people`, `days`, `daily_calories`, `allergens`, `budget`, `pantry`); separate system vs user prompts; wrap sections in `<instructions>` / `<schema>`; JSON mode + `json.loads`.
- Flow: draft → critique/revise loop (`MAX_PASSES = 3`) → grocery list. See [python/docs/wiring-user-inputs-to-meal-plan.md](python/docs/wiring-user-inputs-to-meal-plan.md).

### Python pitfalls

- Bare sibling imports (`from get_completion import …`) only work when running files as scripts; prefer package/relative imports when changing imports.
- `critique_plan.py` currently swaps `get_completion` positional args vs other modules — fix carefully; do not copy that pattern.
- `get_completion.py` constructs the OpenAI client at import time (needs `OPENAI_API_KEY`).
- A full `build_plan.py` run can make up to ~8 live `gpt-4o` calls.

## Web app (planned under `web/`)

### Decisions

- Astro with **Preact islands** (not full React)
- TypeScript port of the agent workflow on the **same** Worker via `@astrojs/cloudflare`
- Ultracite (Biome) in `web/` only — **no Turborepo / Nx**
- Production model: `gemini-2.5-flash-lite` (not OpenAI)
- One interactive island (`MealPlannerForm` with `client:load`); static Astro shell for brand/layout

### Module map

Put shared logic under `web/src/lib/meal-planner/`:

| Python | TypeScript |
|--------|------------|
| `meal_plan.py` | `draft-meal-plan.ts` + shared schemas/types |
| `critique_plan.py` | `critique-plan.ts` |
| `revise_plan.py` | `revise-plan.ts` + `build-grocery-list.ts` |
| `build_plan.py` | `build-plan.ts` (`MAX_PASSES = 3`) |
| `get_completion.py` | `get-completion.ts` (Gemini JSON / schema mode) |

Same prompts, schemas, and loop behavior as Python. API uses camelCase `UserInputs`; map to the same prompt values the Python snake_case dict uses today.

### API route

`web/src/pages/api/plan.ts` (`prerender = false`):

1. Zod-validate body  
2. Verify Turnstile server-side  
3. Enforce KV abuse gates (see [PRD.md](PRD.md))  
4. `buildPlan` → grocery list  
5. Return `{ plan, shoppingList }`

Do not call Gemini until every gate passes. Do not increment success quota on failed generations. Never expose `GEMINI_API_KEY` to the browser.

### Scaffold notes (when creating `web/`)

- **pnpm only** inside the container — see [.devcontainer/README.md](.devcontainer/README.md)
- `packageManager` must match Dockerfile `PNPM_VERSION` (documented as `11.29.0`)
- Copy [`.devcontainer/npmrc.web.example`](.devcontainer/npmrc.web.example) → `web/.npmrc`
- Ultracite: `pnpm dlx ultracite@latest init --linter biome` inside `web/`
- After `wrangler.jsonc` exists, create KV `MEAL_PLANNER_QUOTAS` (+ preview) and paste ids

## DevEnv hard rules

Do not undo these (already implemented in the Dev Container):

| Rule | Detail |
|------|--------|
| Runtime / PM | **Node + pnpm only**. Reject Bun runtime and Bun-as-PM. Use `pnpm create` / `pnpm dlx` — never `npm create` / `npx` (they drop `package-lock.json`). |
| pnpm pin | Dockerfile `PNPM_VERSION` and `web/package.json` `packageManager` must match. Do not `corepack prepare pnpm@latest`. |
| No global `CI=1` | Breaks outdated lockfiles and changes Astro/Vite. Keep installs non-interactive via Corepack / `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` only. |
| Secrets | Worker secrets (`GEMINI_API_KEY`, Turnstile) → `web/.dev.vars` / Wrangler secrets — **not** `containerEnv`. Host `CLOUDFLARE_*` in `containerEnv` is Wrangler CLI/deploy only. |
| Store / volumes | Per-repo named volumes. `web/.npmrc` sets `store-dir=~/.local/share/pnpm/store`. Run pnpm **inside `web/`**, not the repo root. |
| allowBuilds | Approve real install scripts: `esbuild`, `workerd`, and `sharp` only if it is a dependency. |
| Node 24 | Maintenance LTS on purpose. Do not “upgrade” the image blindly because Active LTS moved. |
| Ports | Daily app URL is **4321**. Port **8787** is preview / `wrangler dev` only. |
| KV | Not created by Docker. Create `MEAL_PLANNER_QUOTAS` (+ preview) with Wrangler; paste into `wrangler.jsonc`. |
| Formatters | Biome/Ultracite for JS/TS. **Do not** Biome-format `.astro` (Astro extension owns those). |
| HMR | If macOS bind-mount watches flake, set Vite `server.watch.usePolling` — not global polling by default. |
| gitignore | Prefer `**/.dev.vars`, `**/.wrangler`, `web/node_modules`, `web/dist`, `**/.astro`. |
| Do not add | Alchemy, ESLint/Prettier, Drizzle, MDX, `libvips`/`sharp` unless needed, monorepo builders, or COPY of secrets into images. |

## Do / don’t

**Do**

- Mirror Python workflow behavior in the TypeScript port
- Keep `web/` (pnpm) and `python/` (`uv`) isolated
- Enforce [PRD.md](PRD.md) abuse gates before any Gemini call
- Use pnpm + Ultracite in `web/` only
- Link agents to [PRD.md](PRD.md) for product numbers

**Don’t**

- Delete or convert `python/`
- Add Turborepo, Nx, Bun, Alchemy, or auth for v1
- Put `GEMINI_API_KEY` in the client or `containerEnv`
- Skip Turnstile / KV caps
- Stream critique passes in v1
- Commit `.env` or `.dev.vars`
- Print secret values
- Point Python work at system `/usr/bin/python3`
