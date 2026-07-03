import type { FoodRecord, FoodSearchResponse } from "@/lib/food-search-types";
import { foodRowToNutrientRecord } from "@/lib/food-mapper";
import { scaleNutrients } from "@/lib/scale-nutrients";
import { resolveAddParams } from "@/lib/serving-units";

export function buildFinalizedSearchResponse(
  food: FoodRecord,
  parsedQuantity: number,
  parsedUnit: string | null,
  cached: boolean,
): FoodSearchResponse {
  const resolved = resolveAddParams(
    parsedQuantity,
    parsedUnit,
    food.servingUnit,
  );
  const scaledNutrients = scaleNutrients(
    foodRowToNutrientRecord({
      id: food.id,
      name: food.name,
      serving_size: food.servingSize,
      serving_unit: food.servingUnit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      sugar: food.sugar,
      sodium: food.sodium,
      saturated_fat: food.saturatedFat,
      trans_fat: food.transFat,
      cholesterol: food.cholesterol,
      potassium: food.potassium,
      calcium: food.calcium,
      iron: food.iron,
      source: food.source,
      created_at: food.createdAt,
    }),
    resolved.quantity,
    resolved.unit,
  );

  return {
    food,
    scaledNutrients,
    quantity: resolved.quantity,
    unit: resolved.unit,
    servingLabel: resolved.servingLabel,
    cached,
  };
}
