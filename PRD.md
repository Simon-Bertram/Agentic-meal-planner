# PRD — Meal Planner (Web)

Product requirements for the public web meal planner under `web/`.

The Codecademy Python CLI in `python/src/meal_planner/` is a separate reference tool (OpenAI). It is not the production product.

## Summary

Generate a pantry-first, calorie- and budget-aware dinner plan, then a shopping list. Ship as a public Cloudflare Workers demo with no user accounts.

## Goals

- Agentic workflow: draft → critique → revise → grocery list
- Soft spend ceiling around **$5/month** for a public demo
- Low-friction abuse control without authentication

## Users and experience

- Static Astro shell plus one Preact island (`MealPlannerForm`)
- Inputs: pantry (primary UX), people, days, daily calories, allergens, budget
- Site-wide locale preferences (browser `localStorage`, not accounts):
  - Location: ISO 3166-1 alpha-2 country (user-selectable)
  - Currency: ISO 4217, always derived from location (read-only in UI)
  - Measurement system: `metric` | `imperial` (defaults from country; user-overridable)
  - Apply across form labels, budget/cost display, shopping-list quantities, and plan generation
  - First visit with no saved prefs: bootstrap from Worker geo (`request.cf.country`) via server-only `GET /api/locale`; user can override afterward
  - If `cf.country` is missing (e.g. local `astro dev`): fall back to `US` / `USD` / `imperial`; secondary client hint may use the region from `navigator.language` (e.g. `en-GB` → `GB`)
- Defaults match `python/src/meal_planner/user_inputs.py`, plus locale defaults:
  - people: `2`
  - days: `7`
  - daily calories: `2000`
  - allergens: `peanuts`, `shellfish`, `gluten`
  - budget: `110` in the active currency (display with currency code/symbol; was `$110` USD when locale was implicit)
  - pantry: `rice`, `lentils`, `frozen spinach`
  - country / currency / measurement: detected when available; else `US` / `USD` / `imperial`
  - Measurement default from country: `imperial` for `US`, `LR`, `MM`; otherwise `metric`
- Results: day-by-day menu (dish, ingredients, calories, cost), total cost, shopping list
- UI states: loading, `400` validation, Turnstile failure, `429` quota, `503` global cap, Gemini errors

## Core features

- Pantry add / remove
- Settings form (people, days, daily calories, allergens, budget)
- Locale preferences (location → currency; metric/imperial toggle)
- First-visit locale bootstrap from Cloudflare country code
- Turnstile-gated Generate → `POST /api/plan`
- Agentic plan generation (max **3** critique/revise passes)
- Grocery list that excludes pantry items
- Render plan + shopping list on success

## Platform

- One Astro + Preact + Tailwind app on **one** Cloudflare Worker (`@astrojs/cloudflare`)
- Not Bun; not Alchemy; not a multi-Worker or monorepo builder setup
- Model: Google Gemini 2.5 Flash-Lite (`gemini-2.5-flash-lite`) via `GEMINI_API_KEY`
- The browser never sees the Gemini API key
- Home page prerendered; `/api/plan` and `/api/locale` server-only (`prerender = false`)
- Locale bootstrap: `GET /api/locale` reads `request.cf.country` and returns `{ country, currency, measurementSystem }`
- **Daily local URL:** `http://localhost:4321` (`astro dev` / workerd)
- Port **8787** is for `wrangler dev` / `astro preview` only — not the product URL
- Quotas use Workers KV namespace `MEAL_PLANNER_QUOTAS` (`id` + `preview_id` in `wrangler.jsonc`)
- KV is **not** created by the Dev Container; create it with Wrangler after `wrangler.jsonc` exists

## Abuse and cost controls

- No auth / no better-auth — locale prefs are client-persisted browser settings, not accounts; they do not replace Turnstile or KV gates
- Cloudflare Turnstile verified server-side before any Gemini call
- Per-IP: **2** successful plans per UTC day; **1** in-flight request per IP → `429`
- Input caps (reject with `400` if exceeded):
  - max **7** days
  - max **8** people
  - max **20** pantry items
  - max **15** allergens
  - short string lengths on free-text fields
- Global KV circuit breaker: **80** Gemini calls per UTC day (~10 worst-case plans) → `503`
- Google AI / billing alert at **$5**
- Failed generations do **not** increment the success quota

## API contract

- Request: camelCase `UserInputs` plus Turnstile token

```ts
{
  people: number
  days: number
  dailyCalories: number
  allergens: string[]
  budget: number
  pantry: string[]
  country: string // ISO 3166-1 alpha-2
  currency: string // ISO 4217; must match country mapping
  measurementSystem: "metric" | "imperial"
  // plus Turnstile token field
}
```

- Budget and costs are interpreted in `currency` (no implicit USD)
- Ingredient quantities and shopping list use `measurementSystem`
- Location informs regional availability and pricing language in prompts
- Response: `{ plan, shoppingList }`
- Clear JSON errors for missing key, Turnstile failure, Gemini failure, or validation

## Out of scope

- Converting or deleting the Python package
- Turborepo / Nx
- User accounts / better-auth (browser prefs chosen instead for locale/units/currency)
- Streaming or per-pass progress events
- Bun as runtime or package manager
- ESLint / Prettier, Drizzle, MDX
- Multi-Worker or monorepo builders
- GPS / `navigator.geolocation` for locale detection

First version stays one synchronous `/api/plan` request (up to ~8 sequential model calls). A Workers paid plan or higher duration limits may be required.
