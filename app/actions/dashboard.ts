"use server";

import type { DayData } from "@/lib/day-data";
import type { FoodSearchResponse } from "@/lib/food-search-types";
import type { MealType } from "@/lib/meals";
import type {
  BuiltMealItemInput,
  MealPreset,
  MealPresetItemInput,
  RecentFoodItem,
} from "@/lib/presets-types";
import {
  addLogEntry,
  addPresetToLog,
  createBuiltMeal,
  createMealPreset,
  createMealPresetFromDay,
  deleteCachedFood,
  deleteDayLog,
  deleteLogEntry,
  deleteMealPreset,
  getDayData,
  getMealPresets,
  getRecentFoods,
  updateLogEntryDisplayName,
} from "@/lib/supabase-queries";
import {
  getPresetsSchemaStatus,
  getSchemaStatus,
} from "@/lib/supabase-schema";
import {
  builtMealItemsSchema,
  displayNameSchema,
  foodSearchResponseSchema,
  logDateSchema,
  mealPresetSchema,
  mealTypeSchema,
  parseOrThrow,
  positiveIntIdSchema,
  presetItemsSchema,
  presetNameSchema,
} from "@/lib/validation";

export async function fetchDayData(logDate: string): Promise<DayData> {
  return getDayData(parseOrThrow(logDateSchema, logDate));
}

export async function fetchRecentFoods(): Promise<RecentFoodItem[]> {
  return getRecentFoods();
}

export async function fetchMealPresets(): Promise<MealPreset[]> {
  return getMealPresets();
}

export async function fetchSchemaStatus(): Promise<"ready" | "missing"> {
  return getSchemaStatus();
}

export async function fetchPresetsSchemaStatus(): Promise<"ready" | "missing"> {
  return getPresetsSchemaStatus();
}

export async function addFoodToLog(
  logDate: string,
  result: FoodSearchResponse,
  mealType: MealType,
) {
  return addLogEntry(
    parseOrThrow(logDateSchema, logDate),
    parseOrThrow(foodSearchResponseSchema, result),
    parseOrThrow(mealTypeSchema, mealType),
  );
}

export async function addMealPresetToLog(
  logDate: string,
  preset: MealPreset,
  mealType: MealType,
) {
  return addPresetToLog(
    parseOrThrow(logDateSchema, logDate),
    parseOrThrow(mealPresetSchema, preset),
    parseOrThrow(mealTypeSchema, mealType),
  );
}

export async function saveMealPreset(
  name: string,
  mealType: MealType,
  items: MealPresetItemInput[],
) {
  return createMealPreset(
    parseOrThrow(presetNameSchema, name),
    parseOrThrow(mealTypeSchema, mealType),
    parseOrThrow(presetItemsSchema, items),
  );
}

export async function saveBuiltMeal(
  name: string,
  mealType: MealType,
  items: BuiltMealItemInput[],
) {
  return createBuiltMeal(
    parseOrThrow(presetNameSchema, name),
    parseOrThrow(mealTypeSchema, mealType),
    parseOrThrow(builtMealItemsSchema, items),
  );
}

export async function saveMealPresetFromDay(
  name: string,
  logDate: string,
  mealType: MealType,
) {
  return createMealPresetFromDay(
    parseOrThrow(presetNameSchema, name),
    parseOrThrow(logDateSchema, logDate),
    parseOrThrow(mealTypeSchema, mealType),
  );
}

export async function removeMealPreset(id: number): Promise<void> {
  return deleteMealPreset(parseOrThrow(positiveIntIdSchema, id));
}

export async function removeCachedFood(foodId: number): Promise<void> {
  return deleteCachedFood(parseOrThrow(positiveIntIdSchema, foodId));
}

export async function renameLogEntry(
  entryId: number,
  displayName: string,
): Promise<void> {
  return updateLogEntryDisplayName(
    parseOrThrow(positiveIntIdSchema, entryId),
    parseOrThrow(displayNameSchema, displayName),
  );
}

export async function removeLogEntry(entryId: number): Promise<void> {
  return deleteLogEntry(parseOrThrow(positiveIntIdSchema, entryId));
}

export async function resetDayLog(logDate: string): Promise<void> {
  return deleteDayLog(parseOrThrow(logDateSchema, logDate));
}
