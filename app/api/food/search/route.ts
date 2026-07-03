import { NextRequest, NextResponse } from "next/server";

import { buildFinalizedSearchResponse } from "@/lib/build-food-search-response";
import { foodRowToRecord, nutrientsToFoodInsert } from "@/lib/food-mapper";
import { lookupFood } from "@/lib/gemini";
import { parseFoodInput } from "@/lib/parse-food-input";
import { findFoodByName } from "@/lib/supabase-queries";
import { SCHEMA_SETUP_MESSAGE } from "@/lib/supabase-schema";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 });
  }

  const { quantity, unit, foodName } = parseFoodInput(query);
  const normalizedName = foodName.toLowerCase().trim();

  if (!normalizedName) {
    return NextResponse.json({ error: "Invalid food name" }, { status: 400 });
  }

  try {
    let cached = true;
    const food = await findFoodByName(normalizedName);

    if (!food) {
      cached = false;
      const nutrients = await lookupFood(foodName);
      const insert = nutrientsToFoodInsert(normalizedName, nutrients);
      const foodRecord = {
        id: 0,
        name: normalizedName,
        servingSize: insert.serving_size,
        servingUnit: insert.serving_unit,
        calories: insert.calories,
        protein: insert.protein,
        carbs: insert.carbs,
        fat: insert.fat,
        fiber: insert.fiber,
        sugar: insert.sugar,
        sodium: insert.sodium,
        saturatedFat: insert.saturated_fat,
        transFat: insert.trans_fat,
        cholesterol: insert.cholesterol,
        potassium: insert.potassium,
        calcium: insert.calcium,
        iron: insert.iron,
        source: insert.source,
        createdAt: new Date(0).toISOString(),
      };

      return NextResponse.json(
        buildFinalizedSearchResponse(foodRecord, quantity, unit, cached),
      );
    }

    return NextResponse.json(
      buildFinalizedSearchResponse(
        foodRowToRecord(food),
        quantity,
        unit,
        cached,
      ),
    );
  } catch (error) {
    console.error("Food search failed:", error);
    if (error instanceof Error && error.message === SCHEMA_SETUP_MESSAGE) {
      return NextResponse.json({ error: SCHEMA_SETUP_MESSAGE }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Nutrient data unavailable" },
      { status: 503 },
    );
  }
}
