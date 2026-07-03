export interface MacroValue {
  current: number;
  goal: number;
}

export interface DailyMacros {
  calories: MacroValue;
  protein: MacroValue;
  carbs: MacroValue;
  fat: MacroValue;
}

export type MacroKey = keyof DailyMacros;

export interface MacroConfig {
  key: MacroKey;
  label: string;
  unit: string;
  color: string;
  trackColor: string;
}

export const MACRO_CONFIG: Record<MacroKey, MacroConfig> = {
  calories: {
    key: "calories",
    label: "Calories",
    unit: "kcal",
    color: "var(--color-macro-calories)",
    trackColor: "var(--color-macro-calories-track)",
  },
  protein: {
    key: "protein",
    label: "Protein",
    unit: "g",
    color: "var(--color-macro-protein)",
    trackColor: "var(--color-macro-protein-track)",
  },
  carbs: {
    key: "carbs",
    label: "Carbs",
    unit: "g",
    color: "var(--color-macro-carbs)",
    trackColor: "var(--color-macro-carbs-track)",
  },
  fat: {
    key: "fat",
    label: "Fat",
    unit: "g",
    color: "var(--color-macro-fat)",
    trackColor: "var(--color-macro-fat-track)",
  },
};

export const DEFAULT_DAILY_GOALS: DailyMacros = {
  calories: { current: 0, goal: 2000 },
  protein: { current: 0, goal: 150 },
  carbs: { current: 0, goal: 250 },
  fat: { current: 0, goal: 65 },
};


/** Sample data for prototype — replace with live log data later. */
export const SAMPLE_DAILY_MACROS: DailyMacros = {
  calories: { current: 1420, goal: 2000 },
  protein: { current: 98, goal: 150 },
  carbs: { current: 145, goal: 250 },
  fat: { current: 48, goal: 65 },
};

export function getMacroProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(current / goal, 1);
}

export function getMacroPercent(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.round((current / goal) * 100);
}

export function getRemaining(current: number, goal: number): number {
  return Math.max(goal - current, 0);
}

export function formatMacroValue(key: MacroKey, value: number): string {
  if (key === "calories") {
    return Math.round(value).toLocaleString();
  }
  return value % 1 === 0 ? value.toString() : value.toFixed(1);
}

// --- Extended nutrients (fiber, sodium, etc.) ---

export interface NutrientValue {
  current: number;
  goal: number;
}

export type ExtendedNutrientKey =
  | "fiber"
  | "sugar"
  | "sodium"
  | "saturatedFat"
  | "cholesterol"
  | "potassium"
  | "calcium"
  | "iron";

export type DailyNutrients = Record<ExtendedNutrientKey, NutrientValue>;

export type NutrientDirection = "goal" | "limit";

export interface NutrientConfig {
  key: ExtendedNutrientKey;
  label: string;
  unit: string;
  color: string;
  trackColor: string;
  /** "goal" = higher is better; "limit" = stay under the cap */
  direction: NutrientDirection;
}

export const NUTRIENT_CONFIG: Record<ExtendedNutrientKey, NutrientConfig> = {
  fiber: {
    key: "fiber",
    label: "Fiber",
    unit: "g",
    color: "var(--color-nutrient-fiber)",
    trackColor: "var(--color-nutrient-fiber-track)",
    direction: "goal",
  },
  sugar: {
    key: "sugar",
    label: "Sugar",
    unit: "g",
    color: "var(--color-nutrient-sugar)",
    trackColor: "var(--color-nutrient-sugar-track)",
    direction: "limit",
  },
  sodium: {
    key: "sodium",
    label: "Sodium",
    unit: "mg",
    color: "var(--color-nutrient-sodium)",
    trackColor: "var(--color-nutrient-sodium-track)",
    direction: "limit",
  },
  saturatedFat: {
    key: "saturatedFat",
    label: "Sat. Fat",
    unit: "g",
    color: "var(--color-nutrient-saturated-fat)",
    trackColor: "var(--color-nutrient-saturated-fat-track)",
    direction: "limit",
  },
  cholesterol: {
    key: "cholesterol",
    label: "Cholesterol",
    unit: "mg",
    color: "var(--color-nutrient-cholesterol)",
    trackColor: "var(--color-nutrient-cholesterol-track)",
    direction: "limit",
  },
  potassium: {
    key: "potassium",
    label: "Potassium",
    unit: "mg",
    color: "var(--color-nutrient-potassium)",
    trackColor: "var(--color-nutrient-potassium-track)",
    direction: "goal",
  },
  calcium: {
    key: "calcium",
    label: "Calcium",
    unit: "mg",
    color: "var(--color-nutrient-calcium)",
    trackColor: "var(--color-nutrient-calcium-track)",
    direction: "goal",
  },
  iron: {
    key: "iron",
    label: "Iron",
    unit: "mg",
    color: "var(--color-nutrient-iron)",
    trackColor: "var(--color-nutrient-iron-track)",
    direction: "goal",
  },
};

export const DEFAULT_DAILY_NUTRIENTS: DailyNutrients = {
  fiber: { current: 0, goal: 30 },
  sugar: { current: 0, goal: 50 },
  sodium: { current: 0, goal: 2300 },
  saturatedFat: { current: 0, goal: 20 },
  cholesterol: { current: 0, goal: 300 },
  potassium: { current: 0, goal: 3500 },
  calcium: { current: 0, goal: 1000 },
  iron: { current: 0, goal: 18 },
};

/** Sample data for prototype — replace with live log data later. */
export const SAMPLE_DAILY_NUTRIENTS: DailyNutrients = {
  fiber: { current: 18, goal: 30 },
  sugar: { current: 42, goal: 50 },
  sodium: { current: 1680, goal: 2300 },
  saturatedFat: { current: 14, goal: 20 },
  cholesterol: { current: 185, goal: 300 },
  potassium: { current: 2100, goal: 3500 },
  calcium: { current: 720, goal: 1000 },
  iron: { current: 12, goal: 18 },
};

export function formatNutrientValue(key: ExtendedNutrientKey, value: number): string {
  const config = NUTRIENT_CONFIG[key];
  if (config.unit === "mg" && value >= 100) {
    return Math.round(value).toLocaleString();
  }
  return value % 1 === 0 ? value.toString() : value.toFixed(1);
}

export function getNutrientPercent(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.round((current / goal) * 100);
}

export function isNutrientOverLimit(
  current: number,
  goal: number,
  direction: NutrientDirection,
): boolean {
  return direction === "limit" && current > goal;
}

/** Goal-type micros used for the calendar inner ring. */
export const GOAL_MICRO_KEYS = [
  "fiber",
  "potassium",
  "calcium",
  "iron",
] as const satisfies readonly ExtendedNutrientKey[];

export function getGoalMicroAverageProgress(
  nutrients: DailyNutrients,
): number {
  const sum = GOAL_MICRO_KEYS.reduce((total, key) => {
    const { current, goal } = nutrients[key];
    return total + getMacroProgress(current, goal);
  }, 0);

  return sum / GOAL_MICRO_KEYS.length;
}
