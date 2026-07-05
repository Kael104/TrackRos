"use server";

import { getGoals, updateGoals } from "@/lib/supabase-queries";
import { getSchemaStatus } from "@/lib/supabase-schema";
import { goalsUpdateSchema, parseOrThrow } from "@/lib/validation";
import type { UserGoalsRow } from "@/types/database.types";

export async function fetchGoals(): Promise<UserGoalsRow | null> {
  return getGoals();
}

export async function saveGoals(
  updates: Partial<
    Pick<
      UserGoalsRow,
      | "age"
      | "gender"
      | "calories"
      | "protein_g"
      | "carbs_g"
      | "fat_g"
      | "fiber_g"
      | "sugar_g"
      | "sodium_mg"
      | "saturated_fat_g"
      | "cholesterol_mg"
      | "potassium_mg"
      | "calcium_mg"
      | "iron_mg"
    >
  >,
): Promise<UserGoalsRow> {
  return updateGoals(parseOrThrow(goalsUpdateSchema, updates));
}

export async function fetchSettingsSchemaStatus(): Promise<"ready" | "missing"> {
  return getSchemaStatus();
}
