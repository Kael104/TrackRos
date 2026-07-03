import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. See .env.example.",
  );
}

// #region agent log
const _debugSupabaseHost = supabaseUrl.replace(/^https?:\/\//, "").split("/")[0];
const _debugKeyFormat = supabaseAnonKey.startsWith("eyJ")
  ? "jwt"
  : supabaseAnonKey.startsWith("sb_")
    ? "sb_prefix"
    : "other";
fetch("http://127.0.0.1:7480/ingest/76e8e424-2f5e-40c0-837a-cc42d78f81b4", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Debug-Session-Id": "c99f32",
  },
  body: JSON.stringify({
    sessionId: "c99f32",
    location: "lib/supabase.ts:init",
    message: "Supabase client config",
    data: {
      hypothesisId: "H2-H3",
      supabaseHost: _debugSupabaseHost,
      keyFormat: _debugKeyFormat,
      keyLength: supabaseAnonKey.length,
    },
    timestamp: Date.now(),
    runId: "pre-fix",
  }),
}).catch(() => {});
// #endregion

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabase;
