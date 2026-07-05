import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { isMissingTableError } from "@/lib/supabase-schema";
import { SCHEMA_SETUP_MESSAGE } from "@/lib/schema-messages";

export const GENERIC_DB_ERROR = "A database error occurred. Please try again.";

type DbErrorLike = Pick<PostgrestError, "code" | "message">;

/** Log the real error server-side and throw a safe client-facing message. */
export function sanitizeDbError(error: DbErrorLike, context?: string): never {
  if (isMissingTableError(error)) {
    throw new Error(SCHEMA_SETUP_MESSAGE);
  }

  console.error(
    context ? `[db] ${context}:` : "[db]",
    error.code ?? "unknown",
    error.message,
  );
  throw new Error(GENERIC_DB_ERROR);
}
