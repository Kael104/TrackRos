export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export interface LogEntry {
  id: string;
  foodName: string;
  servings: number;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealConfig {
  type: MealType;
  label: string;
  accentColor: string;
}

export const MEAL_CONFIG: Record<MealType, MealConfig> = {
  breakfast: {
    type: "breakfast",
    label: "Breakfast",
    accentColor: "var(--color-meal-breakfast)",
  },
  lunch: {
    type: "lunch",
    label: "Lunch",
    accentColor: "var(--color-meal-lunch)",
  },
  dinner: {
    type: "dinner",
    label: "Dinner",
    accentColor: "var(--color-meal-dinner)",
  },
  snacks: {
    type: "snacks",
    label: "Snacks",
    accentColor: "var(--color-meal-snacks)",
  },
};

export type DailyMealLog = Record<MealType, LogEntry[]>;

export const DEFAULT_DAILY_MEALS: DailyMealLog = {
  breakfast: [],
  lunch: [],
  dinner: [],
  snacks: [],
};

/** Sample data for prototype — replace with live log data later. */
export const SAMPLE_DAILY_MEALS: DailyMealLog = {
  breakfast: [
    {
      id: "b1",
      foodName: "Greek yogurt",
      servings: 1,
      servingLabel: "cup",
      calories: 150,
      protein: 17,
      carbs: 8,
      fat: 4,
    },
    {
      id: "b2",
      foodName: "Oatmeal",
      servings: 1,
      servingLabel: "bowl",
      calories: 180,
      protein: 6,
      carbs: 32,
      fat: 3,
    },
    {
      id: "b3",
      foodName: "Banana",
      servings: 1,
      servingLabel: "medium",
      calories: 90,
      protein: 1,
      carbs: 23,
      fat: 0,
    },
  ],
  lunch: [
    {
      id: "l1",
      foodName: "Grilled chicken breast",
      servings: 1,
      servingLabel: "serving",
      calories: 220,
      protein: 42,
      carbs: 0,
      fat: 5,
    },
    {
      id: "l2",
      foodName: "Brown rice",
      servings: 1,
      servingLabel: "cup",
      calories: 215,
      protein: 5,
      carbs: 45,
      fat: 2,
    },
    {
      id: "l3",
      foodName: "Mixed greens salad",
      servings: 1,
      servingLabel: "bowl",
      calories: 145,
      protein: 4,
      carbs: 12,
      fat: 9,
    },
  ],
  dinner: [
    {
      id: "d1",
      foodName: "Salmon fillet",
      servings: 1,
      servingLabel: "fillet",
      calories: 280,
      protein: 34,
      carbs: 0,
      fat: 16,
    },
    {
      id: "d2",
      foodName: "Roasted broccoli",
      servings: 1,
      servingLabel: "cup",
      calories: 55,
      protein: 4,
      carbs: 11,
      fat: 1,
    },
  ],
  snacks: [
    {
      id: "s1",
      foodName: "Almonds",
      servings: 1,
      servingLabel: "oz",
      calories: 85,
      protein: 3,
      carbs: 3,
      fat: 7,
    },
  ],
};

export function sumMealCalories(entries: LogEntry[]): number {
  return entries.reduce((total, entry) => total + entry.calories, 0);
}

export function countMealEntries(meals: DailyMealLog): number {
  return (Object.keys(meals) as MealType[]).reduce(
    (total, type) => total + meals[type].length,
    0,
  );
}

export function sumDailyCalories(meals: DailyMealLog): number {
  return (Object.keys(meals) as MealType[]).reduce(
    (total, type) => total + sumMealCalories(meals[type]),
    0,
  );
}

export function formatServings(servings: number, label: string): string {
  const qty =
    servings % 1 === 0 ? servings.toString() : servings.toFixed(1);
  return `${qty} ${label}`;
}
