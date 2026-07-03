import type { FoodRecord } from "@/lib/food-search-types";
import type { MealType } from "@/lib/meals";

/** Minimum log count to show the "frequent" badge. */
export const FREQUENT_FOOD_THRESHOLD = 3;

export interface RecentFoodItem {
  food: FoodRecord;
  lastServings: number;
  lastServingLabel: string;
  lastUsedAt: string;
  useCount: number;
}

export interface MealPresetItem {
  id: number;
  food: FoodRecord;
  servings: number;
  servingLabel: string;
}

export interface MealPreset {
  id: number;
  name: string;
  mealType: MealType;
  items: MealPresetItem[];
  totalCalories: number;
  createdAt: string;
}

export interface MealPresetItemInput {
  foodId: number;
  servings: number;
  servingLabel: string;
}
