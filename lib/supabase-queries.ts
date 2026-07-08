import "server-only";

import type { FoodRecord, FoodSearchResponse } from "@/lib/food-search-types";
import { buildFinalizedSearchResponse } from "@/lib/build-food-search-response";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import {
  foodRowToNutrientRecord,
  foodRowToRecord,
  foodRecordToNutrients,
  nutrientsToFoodInsert,
} from "@/lib/food-mapper";
import { normalizeFoodNameForLookup } from "@/lib/format-food-name";
import type { FoodNutrients } from "@/lib/gemini";
import {
  DEFAULT_DAILY_GOALS,
  DEFAULT_DAILY_NUTRIENTS,
  type ExtendedNutrientKey,
} from "@/lib/nutrients";
import {
  DEFAULT_DAILY_MEALS,
  type LogEntry,
  type MealType,
} from "@/lib/meals";
import type {
  BuiltMealItemInput,
  MealPreset,
  MealPresetItem,
  MealPresetItemInput,
  RecentFoodItem,
} from "@/lib/presets-types";
import { scaleNutrients, type ScaledNutrients } from "@/lib/scale-nutrients";
import type { DayData } from "@/lib/day-data";
import { getPresetsSchemaStatus, getSchemaStatus, isMissingTableError, SCHEMA_SETUP_MESSAGE } from "@/lib/supabase-schema";
import { sanitizeDbError } from "@/lib/db-errors";
import { supabase } from "@/lib/supabase-server";
import type { FoodRow, UserGoalsRow } from "@/types/database.types";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snacks"];

const EXTENDED_NUTRIENT_KEYS: ExtendedNutrientKey[] = [
  "fiber",
  "sugar",
  "sodium",
  "saturatedFat",
  "cholesterol",
  "potassium",
  "calcium",
  "iron",
];

export type { DayData };

function emptyDayData(
  goals?: UserGoalsRow | null,
): DayData {
  const macroGoals = goals
    ? {
        calories: goals.calories,
        protein: goals.protein_g,
        carbs: goals.carbs_g,
        fat: goals.fat_g,
      }
    : {
        calories: DEFAULT_DAILY_GOALS.calories.goal,
        protein: DEFAULT_DAILY_GOALS.protein.goal,
        carbs: DEFAULT_DAILY_GOALS.carbs.goal,
        fat: DEFAULT_DAILY_GOALS.fat.goal,
      };

  const nutrientGoals = goals
    ? {
        fiber: goals.fiber_g,
        sugar: goals.sugar_g,
        sodium: goals.sodium_mg,
        saturatedFat: goals.saturated_fat_g,
        cholesterol: goals.cholesterol_mg,
        potassium: goals.potassium_mg,
        calcium: goals.calcium_mg,
        iron: goals.iron_mg,
      }
    : {
        fiber: DEFAULT_DAILY_NUTRIENTS.fiber.goal,
        sugar: DEFAULT_DAILY_NUTRIENTS.sugar.goal,
        sodium: DEFAULT_DAILY_NUTRIENTS.sodium.goal,
        saturatedFat: DEFAULT_DAILY_NUTRIENTS.saturatedFat.goal,
        cholesterol: DEFAULT_DAILY_NUTRIENTS.cholesterol.goal,
        potassium: DEFAULT_DAILY_NUTRIENTS.potassium.goal,
        calcium: DEFAULT_DAILY_NUTRIENTS.calcium.goal,
        iron: DEFAULT_DAILY_NUTRIENTS.iron.goal,
      };

  return {
    macros: {
      calories: { current: 0, goal: macroGoals.calories },
      protein: { current: 0, goal: macroGoals.protein },
      carbs: { current: 0, goal: macroGoals.carbs },
      fat: { current: 0, goal: macroGoals.fat },
    },
    nutrients: {
      fiber: { current: 0, goal: nutrientGoals.fiber },
      sugar: { current: 0, goal: nutrientGoals.sugar },
      sodium: { current: 0, goal: nutrientGoals.sodium },
      saturatedFat: { current: 0, goal: nutrientGoals.saturatedFat },
      cholesterol: { current: 0, goal: nutrientGoals.cholesterol },
      potassium: { current: 0, goal: nutrientGoals.potassium },
      calcium: { current: 0, goal: nutrientGoals.calcium },
      iron: { current: 0, goal: nutrientGoals.iron },
    },
    meals: { ...DEFAULT_DAILY_MEALS },
  };
}

function goalsRowToDayDataBase(goals: UserGoalsRow | null): DayData {
  return emptyDayData(goals);
}

function cloneDayData(base: DayData): DayData {
  return {
    macros: {
      calories: { ...base.macros.calories },
      protein: { ...base.macros.protein },
      carbs: { ...base.macros.carbs },
      fat: { ...base.macros.fat },
    },
    nutrients: {
      fiber: { ...base.nutrients.fiber },
      sugar: { ...base.nutrients.sugar },
      sodium: { ...base.nutrients.sodium },
      saturatedFat: { ...base.nutrients.saturatedFat },
      cholesterol: { ...base.nutrients.cholesterol },
      potassium: { ...base.nutrients.potassium },
      calcium: { ...base.nutrients.calcium },
      iron: { ...base.nutrients.iron },
    },
    meals: {
      breakfast: [...base.meals.breakfast],
      lunch: [...base.meals.lunch],
      dinner: [...base.meals.dinner],
      snacks: [...base.meals.snacks],
    },
  };
}

function eachDateIsoInRange(startIso: string, endIso: string): string[] {
  return eachDayOfInterval({
    start: parseISO(startIso),
    end: parseISO(endIso),
  }).map((date) => format(date, "yyyy-MM-dd"));
}

function fillRangeWithEmpty(
  startIso: string,
  endIso: string,
  base: DayData,
): Record<string, DayData> {
  const result: Record<string, DayData> = {};

  for (const iso of eachDateIsoInRange(startIso, endIso)) {
    result[iso] = cloneDayData(base);
  }

  return result;
}

function aggregateEntriesIntoDayData(
  entries: LogEntryWithFood[],
  base: DayData,
): DayData {
  let dayData = cloneDayData(base);

  for (const raw of entries) {
    const food = raw.foods;
    if (!food) continue;

    const scaled = scaleNutrients(
      foodRowToNutrientRecord(food),
      raw.servings,
      raw.serving_label,
    );
    const logEntry = buildLogEntry(
      raw.id,
      food,
      raw.servings,
      raw.serving_label,
      raw.display_name,
    );

    dayData = {
      ...addScaledToTotals(dayData, scaled),
      meals: {
        ...dayData.meals,
        [raw.meal_type]: [...dayData.meals[raw.meal_type], logEntry],
      },
    };
  }

  return dayData;
}

function buildLogEntry(
  entryId: number,
  food: FoodRow,
  servings: number,
  servingLabel: string | null,
  displayName?: string | null,
): LogEntry {
  const scaled = scaleNutrients(
    foodRowToNutrientRecord(food),
    servings,
    servingLabel,
  );

  return {
    id: String(entryId),
    foodName: displayName?.trim() || food.name,
    servings,
    servingLabel: servingLabel ?? food.serving_unit,
    calories: Math.round(scaled.calories),
    protein: scaled.protein,
    carbs: scaled.carbs,
    fat: scaled.fat,
  };
}

function addScaledToTotals(
  base: DayData,
  scaled: ScaledNutrients,
): DayData {
  return {
    ...base,
    macros: {
      calories: {
        ...base.macros.calories,
        current: base.macros.calories.current + Math.round(scaled.calories),
      },
      protein: {
        ...base.macros.protein,
        current: base.macros.protein.current + scaled.protein,
      },
      carbs: {
        ...base.macros.carbs,
        current: base.macros.carbs.current + scaled.carbs,
      },
      fat: {
        ...base.macros.fat,
        current: base.macros.fat.current + scaled.fat,
      },
    },
    nutrients: {
      fiber: {
        ...base.nutrients.fiber,
        current:
          base.nutrients.fiber.current + (scaled.fiber ?? 0),
      },
      sugar: {
        ...base.nutrients.sugar,
        current:
          base.nutrients.sugar.current + (scaled.sugar ?? 0),
      },
      sodium: {
        ...base.nutrients.sodium,
        current:
          base.nutrients.sodium.current + (scaled.sodium ?? 0),
      },
      saturatedFat: {
        ...base.nutrients.saturatedFat,
        current:
          base.nutrients.saturatedFat.current +
          (scaled.saturatedFat ?? 0),
      },
      cholesterol: {
        ...base.nutrients.cholesterol,
        current:
          base.nutrients.cholesterol.current +
          (scaled.cholesterol ?? 0),
      },
      potassium: {
        ...base.nutrients.potassium,
        current:
          base.nutrients.potassium.current + (scaled.potassium ?? 0),
      },
      calcium: {
        ...base.nutrients.calcium,
        current:
          base.nutrients.calcium.current + (scaled.calcium ?? 0),
      },
      iron: {
        ...base.nutrients.iron,
        current: base.nutrients.iron.current + (scaled.iron ?? 0),
      },
    },
  };
}

export async function findFoodByName(name: string): Promise<FoodRow | null> {
  const normalized = normalizeFoodNameForLookup(name);
  if (!normalized) {
    return null;
  }

  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .ilike("name", normalized)
    .maybeSingle();

  if (error) {
    sanitizeDbError(error, "findFoodByName");
  }

  return data;
}

export async function findFoodById(id: number): Promise<FoodRow | null> {
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    sanitizeDbError(error, "findFoodById");
  }

  return data;
}

export async function searchFoodsByName(
  prefix: string,
  limit = 8,
): Promise<FoodRow[]> {
  const normalized = prefix.toLowerCase().trim();
  if (!normalized) {
    return [];
  }

  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .ilike("name", `${normalized}%`)
    .order("name")
    .limit(limit);

  if (error) {
    sanitizeDbError(error, "searchFoodsByName");
  }

  return data ?? [];
}

export async function insertFood(
  name: string,
  nutrients: FoodNutrients,
  source = "gemini",
): Promise<FoodRow> {
  const insert = nutrientsToFoodInsert(name, nutrients, source);

  const { data, error } = await supabase
    .from("foods")
    .insert({
      name: insert.name,
      serving_size: insert.serving_size,
      serving_unit: insert.serving_unit,
      calories: insert.calories,
      protein: insert.protein,
      carbs: insert.carbs,
      fat: insert.fat,
      fiber: insert.fiber,
      sugar: insert.sugar,
      sodium: insert.sodium,
      saturated_fat: insert.saturated_fat,
      trans_fat: insert.trans_fat,
      cholesterol: insert.cholesterol,
      potassium: insert.potassium,
      calcium: insert.calcium,
      iron: insert.iron,
      source: insert.source,
    })
    .select("*")
    .single();

  if (error) {
    sanitizeDbError(error, "insertFood");
  }

  return data;
}

export async function getOrCreateDailyLog(logDate: string): Promise<number> {
  const { data: existing, error: selectError } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("log_date", logDate)
    .maybeSingle();

  if (selectError) {
    sanitizeDbError(selectError, "getOrCreateDailyLog/select");
  }

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("daily_logs")
    .insert({ log_date: logDate })
    .select("id")
    .single();

  if (error) {
    sanitizeDbError(error, "getOrCreateDailyLog/insert");
  }

  return data.id;
}

export async function getGoals(): Promise<UserGoalsRow | null> {
  const { data, error } = await supabase
    .from("user_goals")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    sanitizeDbError(error, "getGoals");
  }

  return data;
}

export async function updateGoals(
  updates: Partial<
    Pick<
      UserGoalsRow,
      | "age"
      | "gender"
      | "calories"
      | "protein_g"
      | "carbs_g"
      | "fat_g"
      | "fiber_g"
      | "sugar_g"
      | "sodium_mg"
      | "saturated_fat_g"
      | "cholesterol_mg"
      | "potassium_mg"
      | "calcium_mg"
      | "iron_mg"
    >
  >,
): Promise<UserGoalsRow> {
  const existing = await getGoals();

  if (!existing) {
    throw new Error("No user goals row found. Run supabase/schema.sql seed.");
  }

  const { data, error } = await supabase
    .from("user_goals")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error) {
    sanitizeDbError(error, "updateGoals");
  }

  return data;
}

type LogEntryWithFood = {
  id: number;
  log_id: number;
  food_id: number;
  meal_type: MealType;
  servings: number;
  serving_label: string | null;
  display_name: string | null;
  created_at: string;
  foods: FoodRow;
};

export async function getDayData(logDate: string): Promise<DayData> {
  if ((await getSchemaStatus()) === "missing") {
    return goalsRowToDayDataBase(null);
  }

  const goals = await getGoals();
  const dayData = goalsRowToDayDataBase(goals);

  const { data: dailyLog, error: logError } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("log_date", logDate)
    .maybeSingle();

  if (logError) {
    sanitizeDbError(logError, "getDayData/dailyLog");
  }

  if (!dailyLog) {
    return dayData;
  }

  const { data: entries, error: entriesError } = await supabase
    .from("log_entries")
    .select("*, foods(*)")
    .eq("log_id", dailyLog.id)
    .order("created_at", { ascending: true });

  if (entriesError) {
    sanitizeDbError(entriesError, "getDayData/entries");
  }

  if (!entries?.length) {
    return dayData;
  }

  return aggregateEntriesIntoDayData(entries as LogEntryWithFood[], dayData);
}

export async function getRangeDayData(
  startIso: string,
  endIso: string,
): Promise<Record<string, DayData>> {
  if ((await getSchemaStatus()) === "missing") {
    return fillRangeWithEmpty(startIso, endIso, goalsRowToDayDataBase(null));
  }

  const goals = await getGoals();
  const baseTemplate = goalsRowToDayDataBase(goals);
  const result = fillRangeWithEmpty(startIso, endIso, baseTemplate);

  const { data: dailyLogs, error: logsError } = await supabase
    .from("daily_logs")
    .select("id, log_date")
    .gte("log_date", startIso)
    .lte("log_date", endIso);

  if (logsError) {
    sanitizeDbError(logsError, "getRangeDayData/logs");
  }

  if (!dailyLogs?.length) {
    return result;
  }

  const logIds = dailyLogs.map((log) => log.id);

  const { data: entries, error: entriesError } = await supabase
    .from("log_entries")
    .select("*, foods(*)")
    .in("log_id", logIds)
    .order("created_at", { ascending: true });

  if (entriesError) {
    sanitizeDbError(entriesError, "getRangeDayData/entries");
  }

  const entriesByLogId = new Map<number, LogEntryWithFood[]>();

  for (const raw of (entries ?? []) as LogEntryWithFood[]) {
    const list = entriesByLogId.get(raw.log_id) ?? [];
    list.push(raw);
    entriesByLogId.set(raw.log_id, list);
  }

  for (const log of dailyLogs) {
    const logDate = log.log_date;
    const logEntries = entriesByLogId.get(log.id) ?? [];

    if (!logEntries.length) {
      continue;
    }

    result[logDate] = aggregateEntriesIntoDayData(
      logEntries,
      baseTemplate,
    );
  }

  return result;
}

export async function addLogEntry(
  logDate: string,
  result: FoodSearchResponse,
  mealType: MealType,
): Promise<LogEntry> {
  const logId = await getOrCreateDailyLog(logDate);

  let foodRow: FoodRow;

  if (result.food.id > 0) {
    foodRow = {
      id: result.food.id,
      name: result.food.name,
      serving_size: result.food.servingSize,
      serving_unit: result.food.servingUnit,
      calories: result.food.calories,
      protein: result.food.protein,
      carbs: result.food.carbs,
      fat: result.food.fat,
      fiber: result.food.fiber,
      sugar: result.food.sugar,
      sodium: result.food.sodium,
      saturated_fat: result.food.saturatedFat,
      trans_fat: result.food.transFat,
      cholesterol: result.food.cholesterol,
      potassium: result.food.potassium,
      calcium: result.food.calcium,
      iron: result.food.iron,
      source: result.food.source,
      created_at: result.food.createdAt,
    };
  } else {
    const { food } = await findOrCreateFood(
      result.food.name.toLowerCase().trim(),
      result.food.name,
      foodRecordToNutrients(result.food),
    );
    foodRow = food;
  }

  const { data, error } = await supabase
    .from("log_entries")
    .insert({
      log_id: logId,
      food_id: foodRow.id,
      meal_type: mealType,
      servings: result.quantity,
      serving_label: result.servingLabel,
    })
    .select("id")
    .single();

  if (error) {
    sanitizeDbError(error, "addLogEntry");
  }

  return buildLogEntry(
    data.id,
    foodRow,
    result.quantity,
    result.servingLabel,
  );
}

export async function deleteCachedFood(foodId: number): Promise<void> {
  const { error: logError } = await supabase
    .from("log_entries")
    .delete()
    .eq("food_id", foodId);

  if (logError) {
    sanitizeDbError(logError, "deleteCachedFood/logEntries");
  }

  const { error: presetItemsError } = await supabase
    .from("meal_preset_items")
    .delete()
    .eq("food_id", foodId);

  if (presetItemsError && !isMissingTableError(presetItemsError)) {
    sanitizeDbError(presetItemsError, "deleteCachedFood/presetItems");
  }

  const { error: foodError } = await supabase
    .from("foods")
    .delete()
    .eq("id", foodId);

  if (foodError) {
    sanitizeDbError(foodError, "deleteCachedFood/foods");
  }
}

export async function deleteLogEntry(entryId: number): Promise<void> {
  const { error } = await supabase
    .from("log_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    sanitizeDbError(error, "deleteLogEntry");
  }
}

export async function updateLogEntryDisplayName(
  entryId: number,
  displayName: string,
): Promise<void> {
  const trimmed = displayName.trim();
  if (!trimmed) {
    throw new Error("Food name cannot be empty");
  }

  const { error } = await supabase
    .from("log_entries")
    .update({ display_name: trimmed })
    .eq("id", entryId);

  if (error) {
    sanitizeDbError(error, "updateLogEntryDisplayName");
  }
}

export async function deleteDayLog(logDate: string): Promise<void> {
  const { error } = await supabase
    .from("daily_logs")
    .delete()
    .eq("log_date", logDate);

  if (error) {
    sanitizeDbError(error, "deleteDayLog");
  }
}

export async function findOrCreateFood(
  normalizedName: string,
  displayName: string,
  nutrients: FoodNutrients,
): Promise<{ food: FoodRow; cached: boolean }> {
  const existing = await findFoodByName(normalizedName);
  if (existing) {
    return { food: existing, cached: true };
  }

  const food = await insertFood(normalizedName, nutrients);
  return { food, cached: false };
}

export function foodRowToSearchRecord(row: FoodRow) {
  return foodRowToRecord(row);
}

export function buildFoodSearchResponse(
  food: FoodRecord,
  quantity: number,
  unit: string | null,
): FoodSearchResponse {
  return buildFinalizedSearchResponse(food, quantity, unit, true);
}

function uniqueManualFoodName(baseName: string): Promise<string> {
  return resolveUniqueFoodName(baseName.toLowerCase().trim(), baseName);
}

async function resolveUniqueFoodName(
  normalizedName: string,
  displayName: string,
): Promise<string> {
  const existing = await findFoodByName(normalizedName);
  if (!existing) {
    return normalizedName;
  }

  for (let attempt = 1; attempt <= 99; attempt++) {
    const candidate = `${normalizedName} (manual ${attempt})`;
    const taken = await findFoodByName(candidate);
    if (!taken) {
      return candidate;
    }
  }

  throw new Error(`Could not find a unique name for "${displayName}".`);
}

export async function createManualFood(
  name: string,
  nutrients: FoodNutrients,
): Promise<FoodRecord> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Food name is required.");
  }

  const uniqueName = await uniqueManualFoodName(trimmed);
  const row = await insertFood(uniqueName, nutrients, "manual");
  return foodRowToRecord(row);
}

export async function persistFoodRecord(record: FoodRecord): Promise<FoodRecord> {
  if (record.id > 0) {
    return record;
  }

  if (record.source === "manual") {
    return createManualFood(record.name, foodRecordToNutrients(record));
  }

  const normalizedName = record.name.toLowerCase().trim();
  const { food } = await findOrCreateFood(
    normalizedName,
    record.name,
    foodRecordToNutrients(record),
  );
  return foodRowToRecord(food);
}

export async function createBuiltMeal(
  name: string,
  mealType: MealType,
  items: BuiltMealItemInput[],
): Promise<MealPreset> {
  if (!items.length) {
    throw new Error("A meal must include at least one item.");
  }

  const presetItems: MealPresetItemInput[] = [];

  for (const item of items) {
    const persisted = await persistFoodRecord(item.food);
    presetItems.push({
      foodId: persisted.id,
      servings: item.quantity,
      servingLabel: item.unit ?? item.food.servingUnit,
    });
  }

  return createMealPreset(name, mealType, presetItems);
}

export async function updateBuiltMeal(
  id: number,
  name: string,
  items: BuiltMealItemInput[],
): Promise<MealPreset> {
  if (!items.length) {
    throw new Error("A meal must include at least one item.");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("meal_presets")
    .select("id, meal_type")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    sanitizeDbError(fetchError, "updateBuiltMeal/fetch");
  }

  if (!existing) {
    throw new Error("Meal preset not found.");
  }

  const presetItems: MealPresetItemInput[] = [];

  for (const item of items) {
    const persisted = await persistFoodRecord(item.food);
    presetItems.push({
      foodId: persisted.id,
      servings: item.quantity,
      servingLabel: item.unit ?? item.food.servingUnit,
    });
  }

  const { error: presetError } = await supabase
    .from("meal_presets")
    .update({ name, meal_type: existing.meal_type })
    .eq("id", id);

  if (presetError) {
    sanitizeDbError(presetError, "updateBuiltMeal/preset");
  }

  const { error: deleteError } = await supabase
    .from("meal_preset_items")
    .delete()
    .eq("preset_id", id);

  if (deleteError) {
    sanitizeDbError(deleteError, "updateBuiltMeal/deleteItems");
  }

  const itemRows = presetItems.map((item) => ({
    preset_id: id,
    food_id: item.foodId,
    servings: item.servings,
    serving_label: item.servingLabel,
  }));

  const { error: itemsError } = await supabase
    .from("meal_preset_items")
    .insert(itemRows);

  if (itemsError) {
    sanitizeDbError(itemsError, "updateBuiltMeal/insertItems");
  }

  const presets = await getMealPresets();
  const updated = presets.find((p) => p.id === id);
  if (!updated) {
    throw new Error("Failed to load updated preset.");
  }

  return updated;
}

type RecentLogEntryRow = {
  food_id: number;
  servings: number;
  serving_label: string | null;
  created_at: string;
  foods: FoodRow;
};

export async function getRecentFoods(limit = 12): Promise<RecentFoodItem[]> {
  if ((await getSchemaStatus()) === "missing") {
    return [];
  }

  const { data, error } = await supabase
    .from("log_entries")
    .select("food_id, servings, serving_label, created_at, foods(*)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    sanitizeDbError(error, "getRecentFoods");
  }

  const aggregated = new Map<
    number,
    {
      food: FoodRow;
      lastServings: number;
      lastServingLabel: string;
      lastUsedAt: string;
      useCount: number;
    }
  >();

  for (const row of (data ?? []) as RecentLogEntryRow[]) {
    if (!row.foods) continue;

    const existing = aggregated.get(row.food_id);
    if (!existing) {
      aggregated.set(row.food_id, {
        food: row.foods,
        lastServings: row.servings,
        lastServingLabel: row.serving_label ?? row.foods.serving_unit,
        lastUsedAt: row.created_at,
        useCount: 1,
      });
      continue;
    }

    existing.useCount += 1;
  }

  return Array.from(aggregated.values())
    .sort(
      (a, b) =>
        new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime(),
    )
    .slice(0, limit)
    .map((item) => ({
      food: foodRowToRecord(item.food),
      lastServings: item.lastServings,
      lastServingLabel: item.lastServingLabel,
      lastUsedAt: item.lastUsedAt,
      useCount: item.useCount,
    }));
}

type PresetItemWithFood = {
  id: number;
  preset_id: number;
  food_id: number;
  servings: number;
  serving_label: string | null;
  created_at: string;
  foods: FoodRow;
};

type PresetWithItems = {
  id: number;
  name: string;
  meal_type: MealType;
  created_at: string;
  meal_preset_items: PresetItemWithFood[];
};

function buildMealPreset(row: PresetWithItems): MealPreset {
  const items: MealPresetItem[] = (row.meal_preset_items ?? []).map((item) => ({
    id: item.id,
    food: foodRowToRecord(item.foods),
    servings: item.servings,
    servingLabel: item.serving_label ?? item.foods.serving_unit,
  }));

  const totalCalories = items.reduce((sum, item) => {
    const scaled = scaleNutrients(
      foodRowToNutrientRecord({
        id: item.food.id,
        name: item.food.name,
        serving_size: item.food.servingSize,
        serving_unit: item.food.servingUnit,
        calories: item.food.calories,
        protein: item.food.protein,
        carbs: item.food.carbs,
        fat: item.food.fat,
        fiber: item.food.fiber,
        sugar: item.food.sugar,
        sodium: item.food.sodium,
        saturated_fat: item.food.saturatedFat,
        trans_fat: item.food.transFat,
        cholesterol: item.food.cholesterol,
        potassium: item.food.potassium,
        calcium: item.food.calcium,
        iron: item.food.iron,
        source: item.food.source,
        created_at: item.food.createdAt,
      }),
      item.servings,
      item.servingLabel,
    );
    return sum + Math.round(scaled.calories);
  }, 0);

  return {
    id: row.id,
    name: row.name,
    mealType: row.meal_type,
    items,
    totalCalories,
    createdAt: row.created_at,
  };
}

export async function getMealPresets(): Promise<MealPreset[]> {
  if ((await getPresetsSchemaStatus()) === "missing") {
    return [];
  }

  const { data, error } = await supabase
    .from("meal_presets")
    .select("*, meal_preset_items(*, foods(*))")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    sanitizeDbError(error, "getMealPresets");
  }

  return ((data ?? []) as PresetWithItems[]).map(buildMealPreset);
}

export async function createMealPreset(
  name: string,
  mealType: MealType,
  items: MealPresetItemInput[],
): Promise<MealPreset> {
  if (!items.length) {
    throw new Error("A preset must include at least one food item.");
  }

  const { data: preset, error: presetError } = await supabase
    .from("meal_presets")
    .insert({ name, meal_type: mealType })
    .select("*")
    .single();

  if (presetError) {
    sanitizeDbError(presetError, "createMealPreset/preset");
  }

  const itemRows = items.map((item) => ({
    preset_id: preset.id,
    food_id: item.foodId,
    servings: item.servings,
    serving_label: item.servingLabel,
  }));

  const { error: itemsError } = await supabase
    .from("meal_preset_items")
    .insert(itemRows);

  if (itemsError) {
    await supabase.from("meal_presets").delete().eq("id", preset.id);
    sanitizeDbError(itemsError, "createMealPreset/items");
  }

  const presets = await getMealPresets();
  const created = presets.find((p) => p.id === preset.id);
  if (!created) {
    throw new Error("Failed to load created preset.");
  }

  return created;
}

export async function createMealPresetFromDay(
  name: string,
  logDate: string,
  mealType: MealType,
): Promise<MealPreset> {
  if ((await getSchemaStatus()) === "missing") {
    throw new Error(SCHEMA_SETUP_MESSAGE);
  }

  const { data: dailyLog, error: logError } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("log_date", logDate)
    .maybeSingle();

  if (logError) {
    sanitizeDbError(logError, "createMealPresetFromDay/dailyLog");
  }

  if (!dailyLog) {
    throw new Error(`No log found for ${logDate}.`);
  }

  const { data: entries, error: entriesError } = await supabase
    .from("log_entries")
    .select("food_id, servings, serving_label, foods(*)")
    .eq("log_id", dailyLog.id)
    .eq("meal_type", mealType);

  if (entriesError) {
    sanitizeDbError(entriesError, "createMealPresetFromDay/entries");
  }

  if (!entries?.length) {
    throw new Error(`No ${mealType} items logged on ${logDate}.`);
  }

  const items: MealPresetItemInput[] = entries.map((entry) => ({
    foodId: entry.food_id,
    servings: entry.servings,
    servingLabel:
      entry.serving_label ??
      (entry.foods as FoodRow | null)?.serving_unit ??
      "serving",
  }));

  return createMealPreset(name, mealType, items);
}

export async function deleteMealPreset(id: number): Promise<void> {
  const { error } = await supabase.from("meal_presets").delete().eq("id", id);

  if (error) {
    sanitizeDbError(error, "deleteMealPreset");
  }
}

export async function addPresetToLog(
  logDate: string,
  preset: MealPreset,
  mealType: MealType,
): Promise<LogEntry[]> {
  const logId = await getOrCreateDailyLog(logDate);
  const entries: LogEntry[] = [];

  for (const item of preset.items) {
    const { data, error } = await supabase
      .from("log_entries")
      .insert({
        log_id: logId,
        food_id: item.food.id,
        meal_type: mealType,
        servings: item.servings,
        serving_label: item.servingLabel,
      })
      .select("id")
      .single();

    if (error) {
      sanitizeDbError(error, "addPresetToLog");
    }

    entries.push(
      buildLogEntry(
        data.id,
        {
          id: item.food.id,
          name: item.food.name,
          serving_size: item.food.servingSize,
          serving_unit: item.food.servingUnit,
          calories: item.food.calories,
          protein: item.food.protein,
          carbs: item.food.carbs,
          fat: item.food.fat,
          fiber: item.food.fiber,
          sugar: item.food.sugar,
          sodium: item.food.sodium,
          saturated_fat: item.food.saturatedFat,
          trans_fat: item.food.transFat,
          cholesterol: item.food.cholesterol,
          potassium: item.food.potassium,
          calcium: item.food.calcium,
          iron: item.food.iron,
          source: item.food.source,
          created_at: item.food.createdAt,
        },
        item.servings,
        item.servingLabel,
      ),
    );
  }

  return entries;
}

export { EXTENDED_NUTRIENT_KEYS, MEAL_TYPES };
