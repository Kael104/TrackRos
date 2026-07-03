import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export const SCHEMA_SETUP_MESSAGE =
  "Trackros database tables are missing. Open Supabase Dashboard → SQL Editor, paste the contents of supabase/schema.sql, and run it.";

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
    // #region agent log
    fetch("http://127.0.0.1:7480/ingest/76e8e424-2f5e-40c0-837a-cc42d78f81b4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "c99f32",
      },
      body: JSON.stringify({
        sessionId: "c99f32",
        location: "lib/supabase-schema.ts:getSchemaStatus",
        message: "schema status missing",
        data: {
          hypothesisId: "H1-fix",
          errorCode: error.code,
          errorMessage: error.message,
        },
        timestamp: Date.now(),
        runId: "post-fix",
      }),
    }).catch(() => {});
    // #endregion
    return "missing";
  }

  if (error) {
    throw new Error(error.message);
  }

  cachedSchemaStatus = "ready";
  // #region agent log
  fetch("http://127.0.0.1:7480/ingest/76e8e424-2f5e-40c0-837a-cc42d78f81b4", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "c99f32",
    },
    body: JSON.stringify({
      sessionId: "c99f32",
      location: "lib/supabase-schema.ts:getSchemaStatus",
      message: "schema status ready",
      data: { hypothesisId: "H1-fix" },
      timestamp: Date.now(),
      runId: "post-fix",
    }),
  }).catch(() => {});
  // #endregion
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
