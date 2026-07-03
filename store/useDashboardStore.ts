import { create } from "zustand";

import type { FoodRecord } from "@/lib/food-search-types";
import { formatTodayLabels } from "@/lib/format-date";
import type { DailyMacros, DailyNutrients } from "@/lib/nutrients";
import {
  DEFAULT_DAILY_MEALS,
  type DailyMealLog,
  type LogEntry,
  type MealType,
} from "@/lib/meals";
import type {
  BuiltMealItemInput,
  MealPreset,
  MealPresetItemInput,
  RecentFoodItem,
} from "@/lib/presets-types";
import type { ScaledNutrients } from "@/lib/scale-nutrients";
import {
  updateLogEntryDisplayName,
  addLogEntry,
  addPresetToLog,
  buildFoodSearchResponse,
  createMealPreset,
  createMealPresetFromDay,
  createBuiltMeal,
  deleteCachedFood,
  deleteDayLog,
  deleteLogEntry,
  deleteMealPreset,
  getDayData,
  getMealPresets,
  getRecentFoods,
} from "@/lib/supabase-queries";
import { getPresetsSchemaStatus, getSchemaStatus } from "@/lib/supabase-schema";

interface DashboardStore {
  currentDate: string;
  loading: boolean;
  error: string | null;
  setupRequired: boolean;
  presetsAvailable: boolean;
  recentsLoading: boolean;
  presetsLoading: boolean;
  recents: RecentFoodItem[];
  presets: MealPreset[];
  macros: DailyMacros;
  nutrients: DailyNutrients;
  meals: DailyMealLog;
  loadDay: (date: string) => Promise<void>;
  loadRecents: () => Promise<void>;
  loadPresets: () => Promise<void>;
  addFood: (result: import("@/lib/food-search-types").FoodSearchResponse, mealType: MealType) => Promise<void>;
  quickAddFood: (
    food: FoodRecord,
    quantity: number,
    unit: string | null,
    mealType: MealType,
  ) => Promise<void>;
  addPreset: (preset: MealPreset, mealType: MealType) => Promise<void>;
  savePreset: (
    name: string,
    mealType: MealType,
    items: MealPresetItemInput[],
  ) => Promise<void>;
  saveBuiltMeal: (
    name: string,
    mealType: MealType,
    items: BuiltMealItemInput[],
  ) => Promise<void>;
  savePresetFromDay: (
    name: string,
    date: string,
    mealType: MealType,
  ) => Promise<void>;
  deletePreset: (id: number) => Promise<void>;
  removeCachedFood: (foodId: number) => Promise<void>;
  renameLogEntry: (
    entryId: string,
    mealType: MealType,
    displayName: string,
  ) => Promise<void>;
  removeLogEntry: (entryId: string, mealType: MealType) => Promise<void>;
  resetDay: () => Promise<void>;
}

function applyScaledToState(
  state: Pick<DashboardStore, "macros" | "nutrients">,
  scaled: ScaledNutrients,
  caloriesDelta: number,
): Pick<DashboardStore, "macros" | "nutrients"> {
  return {
    macros: {
      calories: {
        ...state.macros.calories,
        current: state.macros.calories.current + caloriesDelta,
      },
      protein: {
        ...state.macros.protein,
        current: state.macros.protein.current + scaled.protein,
      },
      carbs: {
        ...state.macros.carbs,
        current: state.macros.carbs.current + scaled.carbs,
      },
      fat: {
        ...state.macros.fat,
        current: state.macros.fat.current + scaled.fat,
      },
    },
    nutrients: {
      fiber: {
        ...state.nutrients.fiber,
        current: state.nutrients.fiber.current + (scaled.fiber ?? 0),
      },
      sugar: {
        ...state.nutrients.sugar,
        current: state.nutrients.sugar.current + (scaled.sugar ?? 0),
      },
      sodium: {
        ...state.nutrients.sodium,
        current: state.nutrients.sodium.current + (scaled.sodium ?? 0),
      },
      saturatedFat: {
        ...state.nutrients.saturatedFat,
        current:
          state.nutrients.saturatedFat.current + (scaled.saturatedFat ?? 0),
      },
      cholesterol: {
        ...state.nutrients.cholesterol,
        current:
          state.nutrients.cholesterol.current + (scaled.cholesterol ?? 0),
      },
      potassium: {
        ...state.nutrients.potassium,
        current:
          state.nutrients.potassium.current + (scaled.potassium ?? 0),
      },
      calcium: {
        ...state.nutrients.calcium,
        current: state.nutrients.calcium.current + (scaled.calcium ?? 0),
      },
      iron: {
        ...state.nutrients.iron,
        current: state.nutrients.iron.current + (scaled.iron ?? 0),
      },
    },
  };
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  currentDate: formatTodayLabels().iso,
  loading: false,
  error: null,
  setupRequired: false,
  presetsAvailable: true,
  recentsLoading: false,
  presetsLoading: false,
  recents: [],
  presets: [],
  macros: {
    calories: { current: 0, goal: 2000 },
    protein: { current: 0, goal: 150 },
    carbs: { current: 0, goal: 250 },
    fat: { current: 0, goal: 65 },
  },
  nutrients: {
    fiber: { current: 0, goal: 30 },
    sugar: { current: 0, goal: 50 },
    sodium: { current: 0, goal: 2300 },
    saturatedFat: { current: 0, goal: 20 },
    cholesterol: { current: 0, goal: 300 },
    potassium: { current: 0, goal: 3500 },
    calcium: { current: 0, goal: 1000 },
    iron: { current: 0, goal: 18 },
  },
  meals: DEFAULT_DAILY_MEALS,

  loadDay: async (date: string) => {
    set({ loading: true, error: null, currentDate: date });

    try {
      const schemaStatus = await getSchemaStatus();
      const dayData = await getDayData(date);
      set({
        ...dayData,
        loading: false,
        currentDate: date,
        setupRequired: schemaStatus === "missing",
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load day data";
      set({ loading: false, error: message });
    }
  },

  loadRecents: async () => {
    set({ recentsLoading: true });

    try {
      const recents = await getRecentFoods();
      set({ recents, recentsLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load recent foods";
      set({ recentsLoading: false, error: message });
    }
  },

  loadPresets: async () => {
    set({ presetsLoading: true });

    try {
      const presetsStatus = await getPresetsSchemaStatus();
      const presets =
        presetsStatus === "ready" ? await getMealPresets() : [];
      set({
        presets,
        presetsAvailable: presetsStatus === "ready",
        presetsLoading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load meal presets";
      set({ presetsLoading: false, error: message });
    }
  },

  addFood: async (result, mealType) => {
    const date = get().currentDate;
    set({ error: null });

    try {
      const entry = await addLogEntry(date, result, mealType);
      const { scaledNutrients } = result;

      set((state) => ({
        meals: {
          ...state.meals,
          [mealType]: [...state.meals[mealType], entry],
        },
        ...applyScaledToState(state, scaledNutrients, entry.calories),
      }));

      void get().loadRecents();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add food";
      set({ error: message });
      throw error;
    }
  },

  quickAddFood: async (food, quantity, unit, mealType) => {
    const result = buildFoodSearchResponse(food, quantity, unit);
    await get().addFood(result, mealType);
  },

  addPreset: async (preset, mealType) => {
    const date = get().currentDate;
    set({ error: null });

    try {
      const entries = await addPresetToLog(date, preset, mealType);

      set((state) => {
        let nextMacros = state.macros;
        let nextNutrients = state.nutrients;
        const newEntries = [...state.meals[mealType], ...entries];

        preset.items.forEach((item, index) => {
          const result = buildFoodSearchResponse(
            item.food,
            item.servings,
            item.servingLabel,
          );
          const entry = entries[index];
          const applied = applyScaledToState(
            { macros: nextMacros, nutrients: nextNutrients },
            result.scaledNutrients,
            entry?.calories ?? Math.round(result.scaledNutrients.calories),
          );
          nextMacros = applied.macros;
          nextNutrients = applied.nutrients;
        });

        return {
          meals: {
            ...state.meals,
            [mealType]: newEntries,
          },
          macros: nextMacros,
          nutrients: nextNutrients,
        };
      });

      void get().loadRecents();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add meal preset";
      set({ error: message });
      throw error;
    }
  },

  savePreset: async (name, mealType, items) => {
    set({ error: null });

    try {
      const preset = await createMealPreset(name, mealType, items);
      set((state) => ({
        presets: [preset, ...state.presets.filter((p) => p.id !== preset.id)],
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save preset";
      set({ error: message });
      throw error;
    }
  },

  saveBuiltMeal: async (name, mealType, items) => {
    set({ error: null });

    try {
      const preset = await createBuiltMeal(name, mealType, items);
      set((state) => ({
        presets: [preset, ...state.presets.filter((p) => p.id !== preset.id)],
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save meal";
      set({ error: message });
      throw error;
    }
  },

  savePresetFromDay: async (name, date, mealType) => {
    set({ error: null });

    try {
      const preset = await createMealPresetFromDay(name, date, mealType);
      set((state) => ({
        presets: [preset, ...state.presets.filter((p) => p.id !== preset.id)],
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save preset from log";
      set({ error: message });
      throw error;
    }
  },

  deletePreset: async (id) => {
    set({ error: null });

    try {
      await deleteMealPreset(id);
      set((state) => ({
        presets: state.presets.filter((preset) => preset.id !== id),
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete preset";
      set({ error: message });
      throw error;
    }
  },

  removeCachedFood: async (foodId) => {
    set({ error: null });

    try {
      await deleteCachedFood(foodId);
      const date = get().currentDate;
      const dayData = await getDayData(date);
      const recents = await getRecentFoods();
      const presets = get().presetsAvailable ? await getMealPresets() : get().presets;
      set({ ...dayData, recents, presets });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove cached food";
      set({ error: message });
      throw error;
    }
  },

  renameLogEntry: async (entryId, mealType, displayName) => {
    set({ error: null });

    try {
      await updateLogEntryDisplayName(Number(entryId), displayName);
      const trimmed = displayName.trim();

      set((state) => ({
        meals: {
          ...state.meals,
          [mealType]: state.meals[mealType].map((entry) =>
            entry.id === entryId ? { ...entry, foodName: trimmed } : entry,
          ),
        },
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to rename food";
      set({ error: message });
      throw error;
    }
  },

  removeLogEntry: async (entryId, _mealType) => {
    const todayIso = formatTodayLabels().iso;
    if (get().currentDate !== todayIso) {
      const message = "Cannot remove entries from previous days";
      set({ error: message });
      throw new Error(message);
    }

    set({ error: null });

    try {
      await deleteLogEntry(Number(entryId));
      const dayData = await getDayData(todayIso);
      set(dayData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove food";
      set({ error: message });
      throw error;
    }
  },

  resetDay: async () => {
    const date = get().currentDate;
    set({ error: null });

    try {
      await deleteDayLog(date);
      const dayData = await getDayData(date);
      set(dayData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reset day";
      set({ error: message });
    }
  },
}));

export type { LogEntry };
