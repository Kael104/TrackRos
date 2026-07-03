import type { FoodRecord, FoodSearchResponse } from "@/lib/food-search-types";
import { buildFinalizedSearchResponse } from "@/lib/build-food-search-response";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import {
  foodRowToNutrientRecord,
  foodRowToRecord,
  foodRecordToNutrients,
  nutrientsToFoodInsert,
} from "@/lib/food-mapper";
import type { FoodNutrients } from "@/lib/gemini";
import {
  DEFAULT_DAILY_GOALS,
  DEFAULT_DAILY_NUTRIENTS,
  type DailyMacros,
  type DailyNutrients,
  type ExtendedNutrientKey,
} from "@/lib/nutrients";
import {
  DEFAULT_DAILY_MEALS,
  type DailyMealLog,
  type LogEntry,
  type MealType,
} from "@/lib/meals";
import type {
  MealPreset,
  MealPresetItem,
  MealPresetItemInput,
  RecentFoodItem,
} from "@/lib/presets-types";
import { scaleNutrients, type ScaledNutrients } from "@/lib/scale-nutrients";
import {
  getPresetsSchemaStatus,
  getSchemaStatus,
  isMissingTableError,
  SCHEMA_SETUP_MESSAGE,
} from "@/lib/supabase-schema";
import { supabase } from "@/lib/supabase";
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

export interface DayData {
  macros: DailyMacros;
  nutrients: DailyNutrients;
  meals: DailyMealLog;
}

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
): LogEntry {
  const scaled = scaleNutrients(
    foodRowToNutrientRecord(food),
    servings,
    servingLabel,
  );

  return {
    id: String(entryId),
    foodName: food.name,
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
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .eq("name", name)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(SCHEMA_SETUP_MESSAGE);
    }
    throw new Error(error.message);
  }

  return data;
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
    throw new Error(error.message);
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
    throw new Error(selectError.message);
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
    throw new Error(error.message);
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
      // #region agent log
      fetch("http://127.0.0.1:7480/ingest/76e8e424-2f5e-40c0-837a-cc42d78f81b4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "c99f32",
        },
        body: JSON.stringify({
          sessionId: "c99f32",
          location: "lib/supabase-queries.ts:getGoals",
          message: "user_goals missing, using defaults",
          data: {
            hypothesisId: "H1-fix",
            errorCode: error.code,
            errorMessage: error.message,
          },
          timestamp: Date.now(),
          runId: "post-fix",
        }),
      }).catch(() => {});
      // #endregion
      return null;
    }
    throw new Error(error.message);
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
    throw new Error(error.message);
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
  created_at: string;
  foods: FoodRow;
};

export async function getDayData(logDate: string): Promise<DayData> {
  // #region agent log
  fetch("http://127.0.0.1:7480/ingest/76e8e424-2f5e-40c0-837a-cc42d78f81b4", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "c99f32",
    },
    body: JSON.stringify({
      sessionId: "c99f32",
      location: "lib/supabase-queries.ts:getDayData",
      message: "getDayData invoked",
      data: { hypothesisId: "H5", logDate, runtime: "client-or-server" },
      timestamp: Date.now(),
      runId: "pre-fix",
    }),
  }).catch(() => {});
  // #endregion
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
    throw new Error(logError.message);
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
    throw new Error(entriesError.message);
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
    throw new Error(logsError.message);
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
    throw new Error(entriesError.message);
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
    throw new Error(error.message);
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
    throw new Error(logError.message);
  }

  const { error: presetItemsError } = await supabase
    .from("meal_preset_items")
    .delete()
    .eq("food_id", foodId);

  if (presetItemsError && !isMissingTableError(presetItemsError)) {
    throw new Error(presetItemsError.message);
  }

  const { error: foodError } = await supabase
    .from("foods")
    .delete()
    .eq("id", foodId);

  if (foodError) {
    throw new Error(foodError.message);
  }
}

export async function deleteLogEntry(entryId: number): Promise<void> {
  const { error } = await supabase
    .from("log_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteDayLog(logDate: string): Promise<void> {
  const { error } = await supabase
    .from("daily_logs")
    .delete()
    .eq("log_date", logDate);

  if (error) {
    throw new Error(error.message);
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
    throw new Error(error.message);
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
    throw new Error(error.message);
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
    throw new Error(presetError.message);
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
    throw new Error(itemsError.message);
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
    throw new Error(logError.message);
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
    throw new Error(entriesError.message);
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
    throw new Error(error.message);
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
      throw new Error(error.message);
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
