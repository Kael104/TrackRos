"use server";

import type { FoodRecord } from "@/lib/food-search-types";
import type { FoodNutrients } from "@/lib/gemini";
import {
  createCachedFood,
  deleteCachedFood,
  getAllCachedFoods,
  updateCachedFoodNutrients,
} from "@/lib/supabase-queries";
import { getSchemaStatus } from "@/lib/supabase-schema";
import {
  createCachedFoodSchema,
  parseOrThrow,
  positiveIntIdSchema,
  updateCachedFoodSchema,
} from "@/lib/validation";

export async function fetchCachedFoods(): Promise<FoodRecord[]> {
  return getAllCachedFoods();
}

export async function fetchFoodDataSchemaStatus(): Promise<"ready" | "missing"> {
  return getSchemaStatus();
}

export async function createCachedFoodAction(
  name: string,
  nutrients: FoodNutrients,
): Promise<FoodRecord> {
  const parsed = parseOrThrow(createCachedFoodSchema, { name, nutrients });
  return createCachedFood(parsed.name, parsed.nutrients);
}

export async function updateCachedFoodAction(
  foodId: number,
  nutrients: FoodNutrients,
): Promise<FoodRecord> {
  const parsed = parseOrThrow(updateCachedFoodSchema, { foodId, nutrients });
  return updateCachedFoodNutrients(parsed.foodId, parsed.nutrients);
}

export async function removeCachedFoodAction(foodId: number): Promise<void> {
  return deleteCachedFood(parseOrThrow(positiveIntIdSchema, foodId));
}
