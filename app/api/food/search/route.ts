import { NextRequest, NextResponse } from "next/server";

import { buildFinalizedSearchResponse } from "@/lib/build-food-search-response";
import { csrfDenied, isSameOriginRequest } from "@/lib/csrf";
import { foodRowToRecord, nutrientsToFoodInsert } from "@/lib/food-mapper";
import { lookupFood } from "@/lib/gemini";
import { parseFoodInput } from "@/lib/parse-food-input";
import { findFoodById, findFoodByName } from "@/lib/supabase-queries";
import { SCHEMA_SETUP_MESSAGE } from "@/lib/supabase-schema";
import {
  foodIdParamSchema,
  foodQuerySchema,
  safeParse,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return csrfDenied();
  }

  const rawQuery = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const queryResult = safeParse(foodQuerySchema, rawQuery);
  if (!queryResult.success) {
    return NextResponse.json({ error: queryResult.error }, { status: 400 });
  }

  const query = queryResult.data;
  const { quantity, unit, foodName } = parseFoodInput(query);
  const normalizedName = foodName.toLowerCase().trim();

  if (!normalizedName) {
    return NextResponse.json({ error: "Invalid food name" }, { status: 400 });
  }

  try {
    const idParam = request.nextUrl.searchParams.get("id");
    if (idParam !== null && idParam !== "") {
      const parsedId = Number.parseInt(idParam, 10);
      const idResult = safeParse(foodIdParamSchema, parsedId);
      if (!idResult.success) {
        return NextResponse.json({ error: idResult.error }, { status: 400 });
      }

      const foodById = await findFoodById(idResult.data);
      if (foodById) {
        return NextResponse.json(
          buildFinalizedSearchResponse(
            foodRowToRecord(foodById),
            quantity,
            unit,
            true,
          ),
        );
      }
    }

    let cached = true;
    const food = await findFoodByName(normalizedName);

    if (!food) {
      cached = false;
      const nutrients = await lookupFood(foodName);
      const insert = nutrientsToFoodInsert(foodName, nutrients);
      const foodRecord = {
        id: 0,
        name: insert.name,
        servingSize: insert.serving_size,
        servingUnit: insert.serving_unit,
        piecesPerServing: nutrients.piecesPerServing,
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
