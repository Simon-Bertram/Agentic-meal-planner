import type { MealPlan, ShoppingListItem } from "../../lib/meal-planner/types";

interface PlanResultsProps {
  plan: MealPlan;
  shoppingList: ShoppingListItem[];
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function PlanResults({ plan, shoppingList }: PlanResultsProps) {
  return (
    <section
      aria-labelledby="plan-results-heading"
      class="animate-fade border-line space-y-10 border-t pt-10"
    >
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            class="font-display text-ink text-2xl font-semibold tracking-tight"
            id="plan-results-heading"
          >
            Your dinner plan
          </h2>
          <p class="text-ink-soft mt-1 text-sm">
            Day-by-day menu with calories and estimated cost.
          </p>
        </div>
        <p class="bg-citrus/40 text-ink rounded-md px-3 py-2 text-sm font-semibold">
          Total {formatUsd(plan.total_cost)}
        </p>
      </div>

      <ol class="space-y-6">
        {plan.menu.map((entry) => (
          <li
            class="border-line/70 border-b pb-6 last:border-b-0"
            key={entry.day}
          >
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h3 class="font-display text-ink text-lg font-semibold">
                <span class="text-ink-soft">{entry.day}</span>
                <span class="text-line mx-2">·</span>
                {entry.dish}
              </h3>
              <p class="text-ink-soft text-sm">
                {entry.calories} kcal · {formatUsd(entry.estimated_cost_usd)}
              </p>
            </div>
            <ul class="mt-3 flex flex-wrap gap-2">
              {entry.ingredients.map((ingredient) => (
                <li
                  class="text-ink-soft rounded-md bg-white/70 px-2.5 py-1 text-xs"
                  key={`${entry.day}-${ingredient}`}
                >
                  {ingredient}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div>
        <h3 class="font-display text-ink text-xl font-semibold">
          Shopping list
        </h3>
        <p class="text-ink-soft mt-1 text-sm">
          Only what you still need — pantry items excluded.
        </p>
        {shoppingList.length === 0 ? (
          <p class="text-ink-soft mt-4 text-sm">Nothing extra to buy.</p>
        ) : (
          <ul class="divide-line/60 border-line/60 mt-4 divide-y border-y">
            {shoppingList.map((row) => (
              <li
                class="flex items-baseline justify-between gap-4 py-3 text-sm"
                key={`${row.item}-${row.estimated_quantity}`}
              >
                <span class="text-ink font-medium">{row.item}</span>
                <span class="text-ink-soft">{row.estimated_quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
