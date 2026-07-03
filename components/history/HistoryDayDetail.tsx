"use client";

import { useEffect, useState } from "react";
import { parseISO } from "date-fns";

import { MacroRingChart } from "@/components/dashboard/MacroRingChart";
import { NutrientSummary } from "@/components/dashboard/NutrientSummary";
import { RemainingCalories } from "@/components/dashboard/RemainingCalories";
import { TodaysMeals } from "@/components/dashboard/TodaysMeals";
import { formatTodayLabels } from "@/lib/format-date";
import { getDayData, type DayData } from "@/lib/supabase-queries";

interface HistoryDayDetailProps {
  selectedDate: string;
  onClose: () => void;
}

export function HistoryDayDetail({
  selectedDate,
  onClose,
}: HistoryDayDetailProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayData, setDayData] = useState<DayData | null>(null);

  const { label: dateLabel } = formatTodayLabels(parseISO(selectedDate));

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setError(null);

      try {
        const data = await getDayData(selectedDate);
        if (!cancelled) {
          setDayData(data);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Failed to load day details";
          setError(message);
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  return (
    <section
      className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-card sm:p-8"
      aria-labelledby="history-day-detail-title"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-accent opacity-80"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="history-day-detail-title"
          className="font-heading text-xl font-semibold tracking-tight text-text-primary"
        >
          Day Detail
        </h2>

        <div className="flex shrink-0 items-center gap-2">
          <time
            dateTime={selectedDate}
            className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-text-secondary"
          >
            {dateLabel}
          </time>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close day detail"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-neutral-100"
          >
            Close
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-text-secondary">Loading day details…</p>
      ) : dayData ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <MacroRingChart macros={dayData.macros} />

          <div className="grid gap-8 lg:col-span-2 lg:grid-cols-2 lg:items-stretch">
            <NutrientSummary nutrients={dayData.nutrients} />
            <RemainingCalories macros={dayData.macros} />
          </div>

          <TodaysMeals meals={dayData.meals} />
        </div>
      ) : null}
    </section>
  );
}
