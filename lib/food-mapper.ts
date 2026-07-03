import { formatFoodNameForStorage } from "@/lib/format-food-name";
import type { FoodNutrients } from "@/lib/gemini";
import type { FoodRecord } from "@/lib/food-search-types";
import type { FoodRow } from "@/types/database.types";

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
