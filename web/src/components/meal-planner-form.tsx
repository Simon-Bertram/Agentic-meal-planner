import type { JSX } from "preact";
import { useCallback, useState } from "preact/hooks";
import type {
  MealPlan,
  PlanErrorBody,
  PlanResponse,
  ShoppingListItem,
  UserInputs,
} from "../lib/meal-planner/types";
import { DEFAULT_USER_INPUTS, INPUT_CAPS } from "../lib/meal-planner/types";
import { PlanResults } from "./meal-planner/plan-results";
import { TagList } from "./meal-planner/tag-list";
import { TurnstileWidget } from "./meal-planner/turnstile-widget";

interface MealPlannerFormProps {
  turnstileSiteKey?: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "success"; plan: MealPlan; shoppingList: ShoppingListItem[] };

function errorMessageForStatus(status: number, body: PlanErrorBody): string {
  if (status === 400) {
    return body.error ?? "Check your inputs and try again.";
  }
  if (status === 403) {
    return body.error ?? "Bot check failed. Refresh and try again.";
  }
  if (status === 429) {
    return (
      body.error ??
      "Daily plan limit reached for your network. Try again tomorrow."
    );
  }
  if (status === 503) {
    return (
      body.error ??
      "The planner is at capacity today. Please try again tomorrow."
    );
  }
  if (status === 501) {
    return body.error ?? "Plan generation is not wired up yet.";
  }
  return body.error ?? "Something went wrong generating your plan.";
}

export default function MealPlannerForm({
  turnstileSiteKey = "",
}: MealPlannerFormProps) {
  const [inputs, setInputs] = useState<UserInputs>(DEFAULT_USER_INPUTS);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const isLoading = status.kind === "loading";

  const handlePantryChange = useCallback((pantry: string[]) => {
    setInputs((prev) => ({ ...prev, pantry }));
  }, []);

  const handleAllergensChange = useCallback((allergens: string[]) => {
    setInputs((prev) => ({ ...prev, allergens }));
  }, []);

  const handlePeopleInput = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      const value = Number(event.currentTarget.value);
      setInputs((prev) => ({
        ...prev,
        people: Number.isFinite(value) ? value : prev.people,
      }));
    },
    []
  );

  const handleDaysInput = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      const value = Number(event.currentTarget.value);
      setInputs((prev) => ({
        ...prev,
        days: Number.isFinite(value) ? value : prev.days,
      }));
    },
    []
  );

  const handleCaloriesInput = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      const value = Number(event.currentTarget.value);
      setInputs((prev) => ({
        ...prev,
        dailyCalories: Number.isFinite(value) ? value : prev.dailyCalories,
      }));
    },
    []
  );

  const handleBudgetInput = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      const value = Number(event.currentTarget.value);
      setInputs((prev) => ({
        ...prev,
        budget: Number.isFinite(value) ? value : prev.budget,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: JSX.TargetedEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (inputs.pantry.length === 0) {
        setStatus({
          kind: "error",
          message: "Add at least one pantry item to start.",
        });
        return;
      }

      if (turnstileSiteKey && !turnstileToken) {
        setStatus({
          kind: "error",
          message: "Complete the bot check before generating a plan.",
        });
        return;
      }

      setStatus({ kind: "loading" });

      try {
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...inputs,
            turnstileToken: turnstileToken ?? "",
          }),
        });

        const body = (await response.json()) as PlanResponse & PlanErrorBody;

        if (!response.ok) {
          setStatus({
            kind: "error",
            message: errorMessageForStatus(response.status, body),
          });
          return;
        }

        if (!(body.plan && Array.isArray(body.plan.menu))) {
          setStatus({
            kind: "error",
            message: "Unexpected response from the planner.",
          });
          return;
        }

        setStatus({
          kind: "success",
          plan: body.plan,
          shoppingList: Array.isArray(body.shoppingList)
            ? body.shoppingList
            : [],
        });
      } catch {
        setStatus({
          kind: "error",
          message: "Network error. Check your connection and try again.",
        });
      }
    },
    [inputs, turnstileSiteKey, turnstileToken]
  );

  return (
    <section
      aria-labelledby="planner-form-heading"
      class="animate-rise-delay mx-auto max-w-3xl px-6 pb-20"
    >
      <form
        class="border-line/80 bg-surface/80 space-y-10 rounded-xl border p-6 shadow-[0_1px_0_rgba(20,32,26,0.04)] backdrop-blur-sm sm:p-8"
        onSubmit={handleSubmit}
      >
        <div>
          <h2
            class="font-display text-ink text-xl font-semibold tracking-tight"
            id="planner-form-heading"
          >
            Your pantry &amp; preferences
          </h2>
          <p class="text-ink-soft mt-1 text-sm">
            Pantry comes first. Settings shape the plan around it.
          </p>
        </div>

        <TagList
          disabled={isLoading}
          hint="Ingredients you already have at home."
          label="Pantry"
          maxLength={INPUT_CAPS.maxTagLength}
          maxTags={INPUT_CAPS.maxPantry}
          onChange={handlePantryChange}
          placeholder="e.g. chickpeas"
          tags={inputs.pantry}
        />

        <fieldset class="grid gap-5 sm:grid-cols-2" disabled={isLoading}>
          <legend class="sr-only">Plan settings</legend>

          <label class="text-ink block space-y-2 text-sm font-semibold">
            People
            <input
              class="border-line focus:border-leaf focus:ring-leaf/20 block w-full rounded-md border bg-white/80 px-3 py-2 font-normal outline-none focus:ring-2"
              max={INPUT_CAPS.maxPeople}
              min={1}
              onInput={handlePeopleInput}
              type="number"
              value={inputs.people}
            />
          </label>

          <label class="text-ink block space-y-2 text-sm font-semibold">
            Days
            <input
              class="border-line focus:border-leaf focus:ring-leaf/20 block w-full rounded-md border bg-white/80 px-3 py-2 font-normal outline-none focus:ring-2"
              max={INPUT_CAPS.maxDays}
              min={1}
              onInput={handleDaysInput}
              type="number"
              value={inputs.days}
            />
          </label>

          <label class="text-ink block space-y-2 text-sm font-semibold">
            Daily calories
            <input
              class="border-line focus:border-leaf focus:ring-leaf/20 block w-full rounded-md border bg-white/80 px-3 py-2 font-normal outline-none focus:ring-2"
              min={500}
              onInput={handleCaloriesInput}
              step={50}
              type="number"
              value={inputs.dailyCalories}
            />
          </label>

          <label class="text-ink block space-y-2 text-sm font-semibold">
            Budget (USD)
            <input
              class="border-line focus:border-leaf focus:ring-leaf/20 block w-full rounded-md border bg-white/80 px-3 py-2 font-normal outline-none focus:ring-2"
              min={1}
              onInput={handleBudgetInput}
              step={1}
              type="number"
              value={inputs.budget}
            />
          </label>
        </fieldset>

        <TagList
          disabled={isLoading}
          hint="Foods to keep off the menu."
          label="Allergens"
          maxLength={INPUT_CAPS.maxTagLength}
          maxTags={INPUT_CAPS.maxAllergens}
          onChange={handleAllergensChange}
          placeholder="e.g. dairy"
          tags={inputs.allergens}
        />

        <div class="border-line space-y-4 border-t pt-8">
          <TurnstileWidget
            onToken={setTurnstileToken}
            siteKey={turnstileSiteKey}
          />

          <button
            class="bg-leaf hover:bg-leaf-deep focus-visible:outline-leaf w-full rounded-md px-5 py-3 text-base font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Planning dinners…" : "Generate meal plan"}
          </button>

          {isLoading ? (
            <p
              aria-live="polite"
              class="animate-pulse-soft text-ink-soft text-center text-sm"
            >
              Drafting, critiquing, and building your grocery list. This can
              take a minute.
            </p>
          ) : null}

          {status.kind === "error" ? (
            <p
              aria-live="assertive"
              class="border-danger/30 bg-danger/5 text-danger rounded-md border px-3 py-3 text-sm"
              role="alert"
            >
              {status.message}
            </p>
          ) : null}
        </div>
      </form>

      {status.kind === "success" ? (
        <div class="mt-12">
          <PlanResults plan={status.plan} shoppingList={status.shoppingList} />
        </div>
      ) : null}
    </section>
  );
}
