import { isValid, parseISO } from "date-fns";
import { z } from "zod";

import type { FoodSearchResponse } from "@/lib/food-search-types";
import type { MealType } from "@/lib/meals";
import type {
  BuiltMealItemInput,
  MealPreset,
  MealPresetItemInput,
} from "@/lib/presets-types";

export const MAX_FOOD_QUERY_LENGTH = 200;
export const MAX_NAME_LENGTH = 200;
export const MAX_SERVING_LABEL_LENGTH = 100;
export const MAX_SERVINGS = 1000;
export const MAX_NUTRIENT_VALUE = 100_000;

const LOG_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const mealTypeSchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "snacks",
]) satisfies z.ZodType<MealType>;

export const logDateSchema = z
  .string()
  .trim()
  .regex(LOG_DATE_PATTERN, "Invalid date format")
  .refine((value) => isValid(parseISO(value)), "Invalid calendar date");

export const positiveIntIdSchema = z.number().int().positive();

export const servingsSchema = z
  .number()
  .finite()
  .gt(0, "Servings must be greater than zero")
  .max(MAX_SERVINGS, "Servings exceeds maximum");

const nonNegNutrientSchema = z
  .number()
  .finite()
  .min(0)
  .max(MAX_NUTRIENT_VALUE);

const optionalNonNegNutrientSchema = nonNegNutrientSchema.nullable();

export const foodRecordSchema = z.object({
  id: z.number().int().min(0),
  name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  servingSize: z.number().finite().gt(0).max(MAX_SERVINGS),
  servingUnit: z.string().trim().min(1).max(MAX_SERVING_LABEL_LENGTH),
  piecesPerServing: z.number().finite().gt(0).max(MAX_SERVINGS).nullable().optional(),
  calories: nonNegNutrientSchema,
  protein: nonNegNutrientSchema,
  carbs: nonNegNutrientSchema,
  fat: nonNegNutrientSchema,
  fiber: optionalNonNegNutrientSchema,
  sugar: optionalNonNegNutrientSchema,
  sodium: optionalNonNegNutrientSchema,
  saturatedFat: optionalNonNegNutrientSchema,
  transFat: optionalNonNegNutrientSchema,
  cholesterol: optionalNonNegNutrientSchema,
  potassium: optionalNonNegNutrientSchema,
  calcium: optionalNonNegNutrientSchema,
  iron: optionalNonNegNutrientSchema,
  source: z.string().trim().min(1).max(50),
  createdAt: z.string().trim().min(1).max(64),
});

const scaledNutrientsSchema = z.object({
  calories: nonNegNutrientSchema,
  protein: nonNegNutrientSchema,
  carbs: nonNegNutrientSchema,
  fat: nonNegNutrientSchema,
  fiber: optionalNonNegNutrientSchema,
  sugar: optionalNonNegNutrientSchema,
  sodium: optionalNonNegNutrientSchema,
  saturatedFat: optionalNonNegNutrientSchema,
  transFat: optionalNonNegNutrientSchema,
  cholesterol: optionalNonNegNutrientSchema,
  potassium: optionalNonNegNutrientSchema,
  calcium: optionalNonNegNutrientSchema,
  iron: optionalNonNegNutrientSchema,
});

export const foodSearchResponseSchema = z.object({
  food: foodRecordSchema,
  scaledNutrients: scaledNutrientsSchema,
  quantity: servingsSchema,
  unit: z.string().trim().max(MAX_SERVING_LABEL_LENGTH).nullable(),
  servingLabel: z.string().trim().min(1).max(MAX_SERVING_LABEL_LENGTH),
  countMode: z.enum(["piece", "serving"]).nullable(),
  piecesPerServing: z.number().finite().gt(0).max(MAX_SERVINGS),
  supportsCountModeChoice: z.boolean(),
  cached: z.boolean(),
}) satisfies z.ZodType<FoodSearchResponse>;

export const presetNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(MAX_NAME_LENGTH);

export const displayNameSchema = presetNameSchema;

export const presetItemInputSchema = z.object({
  foodId: positiveIntIdSchema,
  servings: servingsSchema,
  servingLabel: z.string().trim().min(1).max(MAX_SERVING_LABEL_LENGTH),
}) satisfies z.ZodType<MealPresetItemInput>;

export const presetItemsSchema = z
  .array(presetItemInputSchema)
  .min(1, "At least one item is required")
  .max(100);

export const builtMealItemInputSchema = z.object({
  food: foodRecordSchema,
  quantity: servingsSchema,
  unit: z.string().trim().max(MAX_SERVING_LABEL_LENGTH).nullable(),
}) satisfies z.ZodType<BuiltMealItemInput>;

export const builtMealItemsSchema = z
  .array(builtMealItemInputSchema)
  .min(1, "At least one item is required")
  .max(100);

export const mealPresetSchema = z.object({
  id: positiveIntIdSchema,
  name: presetNameSchema,
  mealType: mealTypeSchema,
  items: z
    .array(
      z.object({
        id: positiveIntIdSchema,
        food: foodRecordSchema,
        servings: servingsSchema,
        servingLabel: z.string().trim().min(1).max(MAX_SERVING_LABEL_LENGTH),
      }),
    )
    .min(1)
    .max(100),
  totalCalories: nonNegNutrientSchema,
  createdAt: z.string().trim().min(1).max(64),
}) satisfies z.ZodType<MealPreset>;

export const goalsUpdateSchema = z
  .object({
    age: z.number().int().min(1).max(120).optional(),
    gender: z.enum(["male", "female"]).optional(),
    calories: nonNegNutrientSchema.optional(),
    protein_g: nonNegNutrientSchema.optional(),
    carbs_g: nonNegNutrientSchema.optional(),
    fat_g: nonNegNutrientSchema.optional(),
    fiber_g: nonNegNutrientSchema.optional(),
    sugar_g: nonNegNutrientSchema.optional(),
    sodium_mg: nonNegNutrientSchema.optional(),
    saturated_fat_g: nonNegNutrientSchema.optional(),
    cholesterol_mg: nonNegNutrientSchema.optional(),
    potassium_mg: nonNegNutrientSchema.optional(),
    calcium_mg: nonNegNutrientSchema.optional(),
    iron_mg: nonNegNutrientSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "No goal updates provided");

export const foodQuerySchema = z
  .string()
  .trim()
  .min(1, "Query is required")
  .max(MAX_FOOD_QUERY_LENGTH, "Query is too long");

export const foodSuggestQuerySchema = z
  .string()
  .trim()
  .max(MAX_FOOD_QUERY_LENGTH, "Query is too long");

export const foodIdParamSchema = positiveIntIdSchema;

export const dateRangeSchema = z
  .object({
    startIso: logDateSchema,
    endIso: logDateSchema,
  })
  .refine(
    ({ startIso, endIso }) => startIso <= endIso,
    "Start date must be on or before end date",
  );

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid input";
    throw new ValidationError(message);
  }
  return result.data;
}

export function safeParse<T>(
  schema: z.ZodType<T>,
  value: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(value);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: message };
  }
  return { success: true, data: result.data };
}
