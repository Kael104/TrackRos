"use client";

import { useEffect } from "react";

import { FoodSearchBar } from "@/components/food/FoodSearchBar";
import { MealPresets } from "@/components/food/MealPresets";
import { RecentFoods } from "@/components/food/RecentFoods";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatTodayLabels } from "@/lib/format-date";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function LogPage() {
  const { iso: todayIso } = formatTodayLabels();
  const {
    addFood,
    loadDay,
    loadRecents,
    loadPresets,
    recents,
    presets,
    recentsLoading,
    presetsLoading,
    presetsAvailable,
    error,
  } = useDashboardStore();

  useEffect(() => {
    void loadDay(todayIso);
    void loadRecents();
    void loadPresets();
  }, [loadDay, loadRecents, loadPresets, todayIso]);

  return (
    <PageContainer>
      <PageHeader
        title="Today's Log"
        description="Search for food to look up nutrients. Try something like 3 pc fried chicken."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-soft sm:p-6">
          <FoodSearchBar onAddToDashboard={addFood} />
        </div>

        <RecentFoods items={recents} loading={recentsLoading} />

        <MealPresets
          presets={presets}
          loading={presetsLoading}
          available={presetsAvailable}
          todayIso={todayIso}
        />
      </div>
    </PageContainer>
  );
}
