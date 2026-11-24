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
- Defaults match `python/src/meal_planner/user_inputs.py`:
  - people: `2`
  - days: `7`
  - daily calories: `2000`
  - allergens: `peanuts`, `shellfish`, `gluten`
  - budget: `$110`
  - pantry: `rice`, `lentils`, `frozen spinach`
- Results: day-by-day menu (dish, ingredients, calories, cost), total cost, shopping list
- UI states: loading, `400` validation, Turnstile failure, `429` quota, `503` global cap, Gemini errors

## Core features

- Pantry add / remove
- Settings form (people, days, daily calories, allergens, budget)
- Turnstile-gated Generate → `POST /api/plan`
- Agentic plan generation (max **3** critique/revise passes)
- Grocery list that excludes pantry items
- Render plan + shopping list on success

## Platform

- One Astro + Preact + Tailwind app on **one** Cloudflare Worker (`@astrojs/cloudflare`)
- Not Bun; not Alchemy; not a multi-Worker or monorepo builder setup
- Model: Google Gemini 2.5 Flash-Lite (`gemini-2.5-flash-lite`) via `GEMINI_API_KEY`
- The browser never sees the Gemini API key
- Home page prerendered; `/api/plan` server-only (`prerender = false`)
- **Daily local URL:** `http://localhost:4321` (`astro dev` / workerd)
- Port **8787** is for `wrangler dev` / `astro preview` only — not the product URL
- Quotas use Workers KV namespace `MEAL_PLANNER_QUOTAS` (`id` + `preview_id` in `wrangler.jsonc`)
- KV is **not** created by the Dev Container; create it with Wrangler after `wrangler.jsonc` exists

## Abuse and cost controls

- No auth / no better-auth
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
  // plus Turnstile token field
}
```

- Response: `{ plan, shoppingList }`
- Clear JSON errors for missing key, Turnstile failure, Gemini failure, or validation

## Out of scope

- Converting or deleting the Python package
- Turborepo / Nx
- User accounts / better-auth
- Streaming or per-pass progress events
- Bun as runtime or package manager
- ESLint / Prettier, Drizzle, MDX
- Multi-Worker or monorepo builders

First version stays one synchronous `/api/plan` request (up to ~8 sequential model calls). A Workers paid plan or higher duration limits may be required.
