"use client";

import { useEffect } from "react";

import { MacroRingChart } from "@/components/dashboard/MacroRingChart";
import { NutrientSummary } from "@/components/dashboard/NutrientSummary";
import { RemainingCalories } from "@/components/dashboard/RemainingCalories";
import { TodaysMeals } from "@/components/dashboard/TodaysMeals";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatTodayLabels } from "@/lib/format-date";
import { SCHEMA_SETUP_MESSAGE } from "@/lib/supabase-schema";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function DashboardPage() {
  const { label: todayLabel, iso: todayIso } = formatTodayLabels();
  const { macros, nutrients, meals, loading, error, setupRequired, loadDay, resetDay } =
    useDashboardStore();

  useEffect(() => {
    void loadDay(todayIso);
  }, [loadDay, todayIso]);

  return (
    <PageContainer>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Dashboard"
          description="Your daily macro overview and meal summary."
        />
        <button
          onClick={() => void resetDay()}
          disabled={loading}
          className="mt-1 shrink-0 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset Day
        </button>
      </div>

      {setupRequired && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Database setup required</p>
          <p className="mt-1">{SCHEMA_SETUP_MESSAGE}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-secondary">Loading today&apos;s log…</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <MacroRingChart
            macros={macros}
            dateLabel={todayLabel}
            dateIso={todayIso}
          />

          <NutrientSummary nutrients={nutrients} />

          <TodaysMeals meals={meals} />

          <RemainingCalories macros={macros} />
        </div>
      )}
    </PageContainer>
  );
}
