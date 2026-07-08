import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface FoodNutrients {
  servingSize: number;
  servingUnit: string;
  /** Typical pieces in one order/serving for countable foods. */
  piecesPerServing?: number | null;
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

const REQUIRED_FIELDS: (keyof FoodNutrients)[] = [
  "servingSize",
  "servingUnit",
  "calories",
  "protein",
  "carbs",
  "fat",
];

function buildPrompt(foodName: string): string {
  return `Return a JSON object with nutritional values for ${foodName}.

First classify the food:
- Individual/countable items (siomai, dumpling, egg, nugget, cookie, bread slice, hotdog, etc.): return nutrients for EXACTLY ONE PIECE. Use servingSize: 1 and servingUnit: "piece" (or a natural single-unit noun like "slice" if more accurate). Never aggregate multiple pieces into one entry.
- Dishes/viands/portions (adobo, sinigang, fried rice, stew, soup by bowl): return nutrients for ONE standard single serving. Use servingSize: 1 and servingUnit: a descriptive portion like "serving", "cup", or "bowl".

All nutrient values must be for that single unit only (1 piece OR 1 serving). Always use servingSize: 1.

Also include piecesPerServing (number): for individual/countable items, the typical number of pieces in one order or serving (e.g. siomai: 6, nuggets: 6). For dishes/viands use 1.

Fields: servingSize (number), servingUnit (string), piecesPerServing (number), calories, protein, carbs, fat, fiber, sugar, sodium, saturatedFat, transFat, cholesterol, potassium, calcium, iron. All nutrient values in grams or milligrams as appropriate. Return only valid JSON, no markdown.`;
}

function isGramUnit(unit: string): boolean {
  const lower = unit.toLowerCase().trim();
  return lower === "g" || lower === "gram" || lower === "grams";
}

function scaleOptional(value: number | null, factor: number): number | null {
  if (value === null) return null;
  return value * factor;
}

/** Scale nutrient totals down when Gemini returned a multi-unit servingSize. */
function scaleNutrientsToSingleUnit(nutrients: FoodNutrients): FoodNutrients {
  if (nutrients.servingSize === 1) {
    return nutrients;
  }

  const factor = 1 / nutrients.servingSize;

  return {
    ...nutrients,
    servingSize: 1,
    calories: nutrients.calories * factor,
    protein: nutrients.protein * factor,
    carbs: nutrients.carbs * factor,
    fat: nutrients.fat * factor,
    fiber: scaleOptional(nutrients.fiber, factor),
    sugar: scaleOptional(nutrients.sugar, factor),
    sodium: scaleOptional(nutrients.sodium, factor),
    saturatedFat: scaleOptional(nutrients.saturatedFat, factor),
    transFat: scaleOptional(nutrients.transFat, factor),
    cholesterol: scaleOptional(nutrients.cholesterol, factor),
    potassium: scaleOptional(nutrients.potassium, factor),
    calcium: scaleOptional(nutrients.calcium, factor),
    iron: scaleOptional(nutrients.iron, factor),
  };
}

/** Store nutrients as one unit (servingSize 1) with a descriptive servingUnit. */
function normalizeToMediumServing(
  nutrients: FoodNutrients,
  foodName: string,
): FoodNutrients {
  if (isGramUnit(nutrients.servingUnit)) {
    const scaled = scaleNutrientsToSingleUnit(nutrients);
    return {
      ...scaled,
      servingSize: 1,
      servingUnit: `medium ${foodName}`,
    };
  }

  if (nutrients.servingSize !== 1) {
    return scaleNutrientsToSingleUnit(nutrients);
  }

  return nutrients;
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    return fenced[1].trim();
  }
  return trimmed;
}

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function validateFoodNutrients(data: unknown): FoodNutrients {
  if (!data || typeof data !== "object") {
    throw new Error("Gemini response is not a JSON object");
  }

  const record = data as Record<string, unknown>;

  for (const field of REQUIRED_FIELDS) {
    if (record[field] === undefined || record[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const servingSize = Number(record.servingSize);
  if (!Number.isFinite(servingSize) || servingSize <= 0) {
    throw new Error("Invalid servingSize");
  }

  const servingUnit = String(record.servingUnit).trim();
  if (!servingUnit) {
    throw new Error("Invalid servingUnit");
  }

  return {
    servingSize,
    servingUnit,
    piecesPerServing: parseOptionalNumber(record.piecesPerServing),
    calories: Number(record.calories),
    protein: Number(record.protein),
    carbs: Number(record.carbs),
    fat: Number(record.fat),
    fiber: parseOptionalNumber(record.fiber),
    sugar: parseOptionalNumber(record.sugar),
    sodium: parseOptionalNumber(record.sodium),
    saturatedFat: parseOptionalNumber(record.saturatedFat),
    transFat: parseOptionalNumber(record.transFat),
    cholesterol: parseOptionalNumber(record.cholesterol),
    potassium: parseOptionalNumber(record.potassium),
    calcium: parseOptionalNumber(record.calcium),
    iron: parseOptionalNumber(record.iron),
  };
}

/**
 * Looks up nutrient data for a food name via the Gemini API.
 * Caller is responsible for caching the result.
 */
export async function lookupFood(foodName: string): Promise<FoodNutrients> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent(buildPrompt(foodName));
  const text = result.response.text();

  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch {
    throw new Error("Failed to parse Gemini JSON response");
  }

  return normalizeToMediumServing(validateFoodNutrients(parsed), foodName);
}
