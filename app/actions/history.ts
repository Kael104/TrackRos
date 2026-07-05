"use server";

import type { DayData } from "@/lib/day-data";
import { getDayData, getRangeDayData } from "@/lib/supabase-queries";
import { getSchemaStatus } from "@/lib/supabase-schema";
import { dateRangeSchema, logDateSchema, parseOrThrow } from "@/lib/validation";

export async function fetchRangeDayData(
  startIso: string,
  endIso: string,
): Promise<Record<string, DayData>> {
  const range = parseOrThrow(dateRangeSchema, { startIso, endIso });
  return getRangeDayData(range.startIso, range.endIso);
}

export async function fetchHistorySchemaStatus(): Promise<"ready" | "missing"> {
  return getSchemaStatus();
}

export async function fetchHistoryDayData(logDate: string): Promise<DayData> {
  return getDayData(parseOrThrow(logDateSchema, logDate));
}
