import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { SCHEMA_SETUP_MESSAGE } from "@/lib/schema-messages";
import { supabase } from "@/lib/supabase-server";

export { SCHEMA_SETUP_MESSAGE };

export function isMissingTableError(
  error: Pick<PostgrestError, "code" | "message">,
): boolean {
  return (
    error.code === "PGRST205" ||
    (error.message?.includes("schema cache") ?? false)
  );
}

type SchemaStatus = "unknown" | "ready" | "missing";

let cachedSchemaStatus: SchemaStatus = "unknown";

export async function getSchemaStatus(): Promise<"ready" | "missing"> {
  if (cachedSchemaStatus === "ready") return "ready";
  if (cachedSchemaStatus === "missing") return "missing";

  const { error } = await supabase.from("user_goals").select("id").limit(1);

  if (error && isMissingTableError(error)) {
    cachedSchemaStatus = "missing";
    return "missing";
  }

  if (error) {
    throw new Error(error.message);
  }

  cachedSchemaStatus = "ready";
  return "ready";
}

export function resetSchemaStatusCache(): void {
  cachedSchemaStatus = "unknown";
  cachedPresetsSchemaStatus = "unknown";
}

type PresetsSchemaStatus = "unknown" | "ready" | "missing";

let cachedPresetsSchemaStatus: PresetsSchemaStatus = "unknown";

/** Checks whether meal preset tables exist; missing tables hide presets UI only. */
export async function getPresetsSchemaStatus(): Promise<"ready" | "missing"> {
  if (cachedPresetsSchemaStatus === "ready") return "ready";
  if (cachedPresetsSchemaStatus === "missing") return "missing";

  const { error } = await supabase.from("meal_presets").select("id").limit(1);

  if (error && isMissingTableError(error)) {
    cachedPresetsSchemaStatus = "missing";
    return "missing";
  }

  if (error) {
    throw new Error(error.message);
  }

  cachedPresetsSchemaStatus = "ready";
  return "ready";
}
