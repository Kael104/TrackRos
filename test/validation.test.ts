import { describe, expect, it } from "vitest";

import {
  dateRangeSchema,
  foodIdParamSchema,
  foodQuerySchema,
  foodSearchResponseSchema,
  goalsUpdateSchema,
  logDateSchema,
  mealTypeSchema,
  parseOrThrow,
  safeParse,
  servingsSchema,
  ValidationError,
} from "@/lib/validation";

const validFoodRecord = {
  id: 1,
  name: "Banana",
  servingSize: 1,
  servingUnit: "medium",
  calories: 90,
  protein: 1,
  carbs: 23,
  fat: 0,
  fiber: 3,
  sugar: 12,
  sodium: 1,
  saturatedFat: 0,
  transFat: 0,
  cholesterol: 0,
  potassium: 400,
  calcium: 5,
  iron: 0,
  source: "gemini",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const validFoodSearchResponse = {
  food: validFoodRecord,
  scaledNutrients: {
    calories: 90,
    protein: 1,
    carbs: 23,
    fat: 0,
    fiber: 3,
    sugar: 12,
    sodium: 1,
    saturatedFat: 0,
    transFat: 0,
    cholesterol: 0,
    potassium: 400,
    calcium: 5,
    iron: 0,
  },
  quantity: 1,
  unit: null,
  servingLabel: "medium banana",
  cached: true,
};

describe("validation schemas", () => {
  it("accepts valid meal type and log date", () => {
    expect(parseOrThrow(mealTypeSchema, "breakfast")).toBe("breakfast");
    expect(parseOrThrow(logDateSchema, "2026-07-05")).toBe("2026-07-05");
  });

  it("rejects invalid meal type", () => {
    expect(() => parseOrThrow(mealTypeSchema, "brunch")).toThrow(ValidationError);
  });

  it("rejects malformed log date", () => {
    expect(() => parseOrThrow(logDateSchema, "2026-13-40")).toThrow(ValidationError);
    expect(() => parseOrThrow(logDateSchema, "07-05-2026")).toThrow(ValidationError);
  });

  it("rejects invalid servings", () => {
    expect(() => parseOrThrow(servingsSchema, 0)).toThrow(ValidationError);
    expect(() => parseOrThrow(servingsSchema, Number.NaN)).toThrow(ValidationError);
    expect(() => parseOrThrow(servingsSchema, -1)).toThrow(ValidationError);
  });

  it("rejects negative nutrients in food search response", () => {
    const poisoned = {
      ...validFoodSearchResponse,
      food: { ...validFoodRecord, calories: -100 },
    };

    expect(() => parseOrThrow(foodSearchResponseSchema, poisoned)).toThrow(
      ValidationError,
    );
  });

  it("rejects out-of-range goal updates", () => {
    expect(() => parseOrThrow(goalsUpdateSchema, { age: 200 })).toThrow(
      ValidationError,
    );
    expect(() => parseOrThrow(goalsUpdateSchema, { calories: -50 })).toThrow(
      ValidationError,
    );
  });

  it("rejects oversized food query", () => {
    const oversized = "a".repeat(201);
    const result = safeParse(foodQuerySchema, oversized);
    expect(result.success).toBe(false);
  });

  it("rejects non-positive food id param", () => {
    const result = safeParse(foodIdParamSchema, 0);
    expect(result.success).toBe(false);
  });

  it("validates date ranges", () => {
    expect(
      parseOrThrow(dateRangeSchema, {
        startIso: "2026-07-01",
        endIso: "2026-07-05",
      }),
    ).toEqual({ startIso: "2026-07-01", endIso: "2026-07-05" });

    expect(() =>
      parseOrThrow(dateRangeSchema, {
        startIso: "2026-07-10",
        endIso: "2026-07-05",
      }),
    ).toThrow(ValidationError);
  });
});
