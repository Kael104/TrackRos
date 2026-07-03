import type { FoodNutrientRecord } from "@/lib/food-mapper";
import { computeScaleMultiplier } from "@/lib/serving-units";

export interface ScaledNutrients {
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

function scaleOptional(value: number | null, multiplier: number): number | null {
  if (value === null) return null;
  return value * multiplier;
}

/**
 * Scales nutrient values by quantity and optional unit.
 * Count units (pc, serving, piece) multiply directly; weight units (g) scale by quantity / servingSize.
 */
export function scaleNutrients(
  food: FoodNutrientRecord,
  quantity: number,
  unit?: string | null,
): ScaledNutrients {
  const multiplier = computeScaleMultiplier(
    food.servingSize,
    food.servingUnit,
    quantity,
    unit,
  );

  return {
    calories: food.calories * multiplier,
    protein: food.protein * multiplier,
    carbs: food.carbs * multiplier,
    fat: food.fat * multiplier,
    fiber: scaleOptional(food.fiber, multiplier),
    sugar: scaleOptional(food.sugar, multiplier),
    sodium: scaleOptional(food.sodium, multiplier),
    saturatedFat: scaleOptional(food.saturatedFat, multiplier),
    transFat: scaleOptional(food.transFat, multiplier),
    cholesterol: scaleOptional(food.cholesterol, multiplier),
    potassium: scaleOptional(food.potassium, multiplier),
    calcium: scaleOptional(food.calcium, multiplier),
    iron: scaleOptional(food.iron, multiplier),
  };
}
