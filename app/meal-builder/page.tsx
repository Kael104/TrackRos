"use client";

import { useEffect } from "react";

import { MealBuilder } from "@/components/meal-builder/MealBuilder";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function MealBuilderPage() {
  const { loadPresets, presets, presetsLoading, presetsAvailable, error } =
    useDashboardStore();

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  return (
    <PageContainer>
      <PageHeader
        title="Meal Builder"
        description="Build custom meals from Gemini search results or manually entered macros."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!presetsAvailable ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Meal presets are unavailable until the database schema is set up.
        </div>
      ) : (
        <MealBuilder presets={presets} loading={presetsLoading} />
      )}
    </PageContainer>
  );
}
