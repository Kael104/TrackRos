import { formatFoodNameForStorage } from "@/lib/format-food-name";
import type { FoodNutrients } from "@/lib/gemini";
import type { FoodRecord } from "@/lib/food-search-types";
import { inferPiecesPerServing } from "@/lib/serving-units";
import type { FoodRow, Json } from "@/types/database.types";

/** Nutrient fields stored per food serving (used for scaling). */
export interface FoodNutrientRecord {
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  saturatedFat: number | null;
  transFat: number | null;
  cholesterol: number | null;
  potassium: number | null;
  calcium: number | null;
  iron: number | null;
}

export type NutrientSnapshot = FoodNutrientRecord;

export function foodRowToNutrientRecord(row: FoodRow): FoodNutrientRecord {
  return {
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    fiber: row.fiber,
    sugar: row.sugar,
    sodium: row.sodium,
    saturatedFat: row.saturated_fat,
    transFat: row.trans_fat,
    cholesterol: row.cholesterol,
    potassium: row.potassium,
    calcium: row.calcium,
    iron: row.iron,
  };
}

export function foodRowToRecord(row: FoodRow): FoodRecord {
  return {
    id: row.id,
    name: row.name,
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    piecesPerServing: inferPiecesPerServing(row.serving_unit),
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    fiber: row.fiber,
    sugar: row.sugar,
    sodium: row.sodium,
    saturatedFat: row.saturated_fat,
    transFat: row.trans_fat,
    cholesterol: row.cholesterol,
    potassium: row.potassium,
    calcium: row.calcium,
    iron: row.iron,
    source: row.source,
    createdAt: row.created_at,
  };
}

export function nutrientsToFoodInsert(
  name: string,
  nutrients: FoodNutrients,
  source = "gemini",
): Omit<FoodRow, "id" | "created_at"> {
  return {
    name: formatFoodNameForStorage(name),
    serving_size: nutrients.servingSize,
    serving_unit: nutrients.servingUnit,
    calories: nutrients.calories,
    protein: nutrients.protein,
    carbs: nutrients.carbs,
    fat: nutrients.fat,
    fiber: nutrients.fiber,
    sugar: nutrients.sugar,
    sodium: nutrients.sodium,
    saturated_fat: nutrients.saturatedFat,
    trans_fat: nutrients.transFat,
    cholesterol: nutrients.cholesterol,
    potassium: nutrients.potassium,
    calcium: nutrients.calcium,
    iron: nutrients.iron,
    source,
  };
}

export function foodRecordToNutrients(record: FoodRecord): FoodNutrients {
  return {
    servingSize: record.servingSize,
    servingUnit: record.servingUnit,
    calories: record.calories,
    protein: record.protein,
    carbs: record.carbs,
    fat: record.fat,
    fiber: record.fiber,
    sugar: record.sugar,
    sodium: record.sodium,
    saturatedFat: record.saturatedFat,
    transFat: record.transFat,
    cholesterol: record.cholesterol,
    potassium: record.potassium,
    calcium: record.calcium,
    iron: record.iron,
  };
}

export function nutrientRecordToSnapshot(
  record: FoodNutrientRecord,
): Json {
  return {
    servingSize: record.servingSize,
    servingUnit: record.servingUnit,
    calories: record.calories,
    protein: record.protein,
    carbs: record.carbs,
    fat: record.fat,
    fiber: record.fiber,
    sugar: record.sugar,
    sodium: record.sodium,
    saturatedFat: record.saturatedFat,
    transFat: record.transFat,
    cholesterol: record.cholesterol,
    potassium: record.potassium,
    calcium: record.calcium,
    iron: record.iron,
  };
}

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function parseRequiredNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function parseRequiredString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
}

export function snapshotToNutrientRecord(
  snapshot: Json | null | undefined,
): FoodNutrientRecord | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return null;
  }

  const record = snapshot as Record<string, unknown>;
  const servingSize = parseRequiredNumber(record.servingSize);
  const servingUnit = parseRequiredString(record.servingUnit);
  const calories = parseRequiredNumber(record.calories);
  const protein = parseRequiredNumber(record.protein);
  const carbs = parseRequiredNumber(record.carbs);
  const fat = parseRequiredNumber(record.fat);

  if (
    servingSize === null ||
    servingUnit === null ||
    calories === null ||
    protein === null ||
    carbs === null ||
    fat === null
  ) {
    return null;
  }

  return {
    servingSize,
    servingUnit,
    calories,
    protein,
    carbs,
    fat,
    fiber: parseNullableNumber(record.fiber),
    sugar: parseNullableNumber(record.sugar),
    sodium: parseNullableNumber(record.sodium),
    saturatedFat: parseNullableNumber(record.saturatedFat),
    transFat: parseNullableNumber(record.transFat),
    cholesterol: parseNullableNumber(record.cholesterol),
    potassium: parseNullableNumber(record.potassium),
    calcium: parseNullableNumber(record.calcium),
    iron: parseNullableNumber(record.iron),
  };
}

export function nutrientsToNutrientRecord(
  nutrients: FoodNutrients,
): FoodNutrientRecord {
  return {
    servingSize: nutrients.servingSize,
    servingUnit: nutrients.servingUnit,
    calories: nutrients.calories,
    protein: nutrients.protein,
    carbs: nutrients.carbs,
    fat: nutrients.fat,
    fiber: nutrients.fiber,
    sugar: nutrients.sugar,
    sodium: nutrients.sodium,
    saturatedFat: nutrients.saturatedFat,
    transFat: nutrients.transFat,
    cholesterol: nutrients.cholesterol,
    potassium: nutrients.potassium,
    calcium: nutrients.calcium,
    iron: nutrients.iron,
  };
}
