import { NextRequest, NextResponse } from "next/server";

import { csrfDenied, isSameOriginRequest } from "@/lib/csrf";
import { foodRowToRecord } from "@/lib/food-mapper";
import { parseFoodInput } from "@/lib/parse-food-input";
import { searchFoodsByName } from "@/lib/supabase-queries";
import { SCHEMA_SETUP_MESSAGE } from "@/lib/supabase-schema";
import { foodSuggestQuerySchema, safeParse } from "@/lib/validation";

export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return csrfDenied();
  }

  const rawQuery = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const queryResult = safeParse(foodSuggestQuerySchema, rawQuery);
  if (!queryResult.success) {
    return NextResponse.json({ error: queryResult.error }, { status: 400 });
  }

  const query = queryResult.data;
  const { foodName } = parseFoodInput(query);
  const normalizedName = foodName.toLowerCase().trim();

  if (!normalizedName || normalizedName.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const rows = await searchFoodsByName(normalizedName);
    const suggestions = rows.map(foodRowToRecord);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Food suggest failed:", error);
    if (error instanceof Error && error.message === SCHEMA_SETUP_MESSAGE) {
      return NextResponse.json({ error: SCHEMA_SETUP_MESSAGE }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Could not load food suggestions" },
      { status: 503 },
    );
  }
}
