import { format } from "date-fns";
import { create } from "zustand";

import {
  createCachedFoodAction,
  fetchCachedFoods,
  fetchFoodDataSchemaStatus,
  removeCachedFoodAction,
  updateCachedFoodAction,
} from "@/app/actions/foods";
import type { FoodRecord } from "@/lib/food-search-types";
import type { FoodNutrients } from "@/lib/gemini";
import { useDashboardStore } from "@/store/useDashboardStore";

interface FoodDataStore {
  foods: FoodRecord[];
  loading: boolean;
  error: string | null;
  available: boolean;
  loadFoods: () => Promise<void>;
  updateFood: (foodId: number, nutrients: FoodNutrients) => Promise<FoodRecord>;
  addFood: (name: string, nutrients: FoodNutrients) => Promise<FoodRecord>;
  deleteFood: (foodId: number) => Promise<void>;
}

async function refreshDashboardIfToday() {
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const { currentDate, loadDay } = useDashboardStore.getState();
  if (currentDate === todayIso) {
    await loadDay(todayIso);
  }
}

export const useFoodDataStore = create<FoodDataStore>((set) => ({
  foods: [],
  loading: false,
  error: null,
  available: true,

  loadFoods: async () => {
    set({ loading: true, error: null });

    try {
      const schemaStatus = await fetchFoodDataSchemaStatus();
      const foods = schemaStatus === "ready" ? await fetchCachedFoods() : [];

      set({
        foods,
        loading: false,
        available: schemaStatus === "ready",
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load food data";
      set({ loading: false, error: message });
    }
  },

  updateFood: async (foodId, nutrients) => {
    set({ error: null });

    try {
      const updated = await updateCachedFoodAction(foodId, nutrients);
      set((state) => ({
        foods: state.foods.map((food) =>
          food.id === updated.id ? updated : food,
        ),
      }));
      await refreshDashboardIfToday();
      return updated;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update food";
      set({ error: message });
      throw error;
    }
  },

  addFood: async (name, nutrients) => {
    set({ error: null });

    try {
      const created = await createCachedFoodAction(name, nutrients);
      set((state) => ({
        foods: [...state.foods, created].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      }));
      return created;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add food";
      set({ error: message });
      throw error;
    }
  },

  deleteFood: async (foodId) => {
    set({ error: null });

    try {
      await removeCachedFoodAction(foodId);
      set((state) => ({
        foods: state.foods.filter((food) => food.id !== foodId),
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete food";
      set({ error: message });
      throw error;
    }
  },
}));
