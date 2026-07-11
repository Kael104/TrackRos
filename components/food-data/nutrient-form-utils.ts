import type { FoodRecord } from "@/lib/food-search-types";
import type { FoodNutrients } from "@/lib/gemini";

export interface NutrientFormValues {
  servingSize: string;
  servingUnit: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
  saturatedFat: string;
  transFat: string;
  cholesterol: string;
  potassium: string;
  calcium: string;
  iron: string;
}

export const DEFAULT_NUTRIENT_FORM_VALUES: NutrientFormValues = {
  servingSize: "1",
  servingUnit: "serving",
  calories: "0",
  protein: "0",
  carbs: "0",
  fat: "0",
  fiber: "",
  sugar: "",
  sodium: "",
  saturatedFat: "",
  transFat: "",
  cholesterol: "",
  potassium: "",
  calcium: "",
  iron: "",
};

function nullableNumberToInput(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

export function foodRecordToFormValues(food: FoodRecord): NutrientFormValues {
  return {
    servingSize: String(food.servingSize),
    servingUnit: food.servingUnit,
    calories: String(food.calories),
    protein: String(food.protein),
    carbs: String(food.carbs),
    fat: String(food.fat),
    fiber: nullableNumberToInput(food.fiber),
    sugar: nullableNumberToInput(food.sugar),
    sodium: nullableNumberToInput(food.sodium),
    saturatedFat: nullableNumberToInput(food.saturatedFat),
    transFat: nullableNumberToInput(food.transFat),
    cholesterol: nullableNumberToInput(food.cholesterol),
    potassium: nullableNumberToInput(food.potassium),
    calcium: nullableNumberToInput(food.calcium),
    iron: nullableNumberToInput(food.iron),
  };
}

function parseRequiredNumber(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid non-negative number`);
  }
  return parsed;
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Optional nutrients must be valid non-negative numbers");
  }
  return parsed;
}

export function formValuesToNutrients(values: NutrientFormValues): FoodNutrients {
  const servingSize = parseRequiredNumber(values.servingSize, "Serving size");
  if (servingSize <= 0) {
    throw new Error("Serving size must be greater than zero");
  }

  const servingUnit = values.servingUnit.trim();
  if (!servingUnit) {
    throw new Error("Serving unit is required");
  }

  return {
    servingSize,
    servingUnit,
    calories: parseRequiredNumber(values.calories, "Calories"),
    protein: parseRequiredNumber(values.protein, "Protein"),
    carbs: parseRequiredNumber(values.carbs, "Carbs"),
    fat: parseRequiredNumber(values.fat, "Fat"),
    fiber: parseOptionalNumber(values.fiber),
    sugar: parseOptionalNumber(values.sugar),
    sodium: parseOptionalNumber(values.sodium),
    saturatedFat: parseOptionalNumber(values.saturatedFat),
    transFat: parseOptionalNumber(values.transFat),
    cholesterol: parseOptionalNumber(values.cholesterol),
    potassium: parseOptionalNumber(values.potassium),
    calcium: parseOptionalNumber(values.calcium),
    iron: parseOptionalNumber(values.iron),
  };
}

export const NUTRIENT_FIELD_GROUPS = [
  {
    title: "Serving",
    fields: [
      { key: "servingSize", label: "Serving size", type: "number" as const },
      { key: "servingUnit", label: "Serving unit", type: "text" as const },
    ],
  },
  {
    title: "Macros",
    fields: [
      { key: "calories", label: "Calories", type: "number" as const, unit: "kcal" },
      { key: "protein", label: "Protein", type: "number" as const, unit: "g" },
      { key: "carbs", label: "Carbs", type: "number" as const, unit: "g" },
      { key: "fat", label: "Fat", type: "number" as const, unit: "g" },
    ],
  },
  {
    title: "Micronutrients",
    fields: [
      { key: "fiber", label: "Fiber", type: "number" as const, unit: "g", optional: true },
      { key: "sugar", label: "Sugar", type: "number" as const, unit: "g", optional: true },
      { key: "sodium", label: "Sodium", type: "number" as const, unit: "mg", optional: true },
      { key: "saturatedFat", label: "Sat. fat", type: "number" as const, unit: "g", optional: true },
      { key: "transFat", label: "Trans fat", type: "number" as const, unit: "g", optional: true },
      { key: "cholesterol", label: "Cholesterol", type: "number" as const, unit: "mg", optional: true },
      { key: "potassium", label: "Potassium", type: "number" as const, unit: "mg", optional: true },
      { key: "calcium", label: "Calcium", type: "number" as const, unit: "mg", optional: true },
      { key: "iron", label: "Iron", type: "number" as const, unit: "mg", optional: true },
    ],
  },
] as const;
