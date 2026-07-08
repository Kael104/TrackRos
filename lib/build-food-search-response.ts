import type { FoodRecord, FoodSearchResponse } from "@/lib/food-search-types";
import { foodRowToNutrientRecord } from "@/lib/food-mapper";
import { scaleNutrients } from "@/lib/scale-nutrients";
import {
  inferPiecesPerServing,
  resolveAddParams,
  type CountMode,
} from "@/lib/serving-units";

function foodRecordToNutrientInput(food: FoodRecord) {
  return foodRowToNutrientRecord({
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
  });
}

export function buildFinalizedSearchResponse(
  food: FoodRecord,
  parsedQuantity: number,
  parsedUnit: string | null,
  cached: boolean,
  countMode?: CountMode,
  piecesPerServing?: number | null,
): FoodSearchResponse {
  const pps = inferPiecesPerServing(
    food.servingUnit,
    piecesPerServing ?? food.piecesPerServing,
  );
  const resolved = resolveAddParams(
    parsedQuantity,
    parsedUnit,
    food.servingUnit,
    countMode,
    pps,
  );
  const scaledNutrients = scaleNutrients(
    foodRecordToNutrientInput(food),
    resolved.quantity,
    resolved.unit,
    resolved.countMode,
    resolved.piecesPerServing,
  );

  return {
    food: {
      ...food,
      piecesPerServing: pps,
    },
    scaledNutrients,
    quantity: resolved.quantity,
    unit: resolved.unit,
    servingLabel: resolved.servingLabel,
    countMode: resolved.countMode,
    piecesPerServing: resolved.piecesPerServing,
    supportsCountModeChoice: resolved.supportsCountModeChoice,
    cached,
  };
}
