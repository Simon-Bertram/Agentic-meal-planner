export interface UserInputs {
  allergens: string[];
  budget: number;
  dailyCalories: number;
  days: number;
  pantry: string[];
  people: number;
}

export interface MenuItem {
  calories: number;
  day: string;
  dish: string;
  estimated_cost_usd: number;
  ingredients: string[];
}

export interface MealPlan {
  menu: MenuItem[];
  total_cost: number;
}

export interface ShoppingListItem {
  estimated_quantity: string;
  item: string;
}

export interface PlanResponse {
  plan: MealPlan;
  shoppingList: ShoppingListItem[];
}

export interface PlanErrorBody {
  error?: string;
}

export const DEFAULT_USER_INPUTS: UserInputs = {
  people: 2,
  days: 7,
  dailyCalories: 2000,
  allergens: ["peanuts", "shellfish", "gluten"],
  budget: 110,
  pantry: ["rice", "lentils", "frozen spinach"],
};

export const INPUT_CAPS = {
  maxDays: 7,
  maxPeople: 8,
  maxPantry: 20,
  maxAllergens: 15,
  maxTagLength: 40,
} as const;
