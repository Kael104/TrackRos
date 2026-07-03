"use client";

import Link from "next/link";
import { useState } from "react";

import { MealTypeDropdown } from "@/components/food/MealTypeDropdown";
import type { MealType } from "@/lib/meals";
import type { MealPreset } from "@/lib/presets-types";
import { useDashboardStore } from "@/store/useDashboardStore";

interface MealPresetsProps {
  presets: MealPreset[];
  loading?: boolean;
  available?: boolean;
  todayIso: string;
}

export function MealPresets({
  presets,
  loading = false,
  available = true,
  todayIso,
}: MealPresetsProps) {
  const { addPreset, deletePreset, savePresetFromDay, meals } =
    useDashboardStore();

  const [presetMeals, setPresetMeals] = useState<Record<number, MealType>>({});
  const [addingPresetId, setAddingPresetId] = useState<number | null>(null);
  const [addedPresetId, setAddedPresetId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [saveFromLogOpen, setSaveFromLogOpen] = useState(false);
  const [saveFromLogMeal, setSaveFromLogMeal] = useState<MealType>("breakfast");
  const [saveFromLogName, setSaveFromLogName] = useState("");
  const [saveFromLogSaving, setSaveFromLogSaving] = useState(false);

  function getPresetMeal(preset: MealPreset): MealType {
    return presetMeals[preset.id] ?? preset.mealType;
  }

  async function handleAddPreset(preset: MealPreset) {
    const mealType = getPresetMeal(preset);
    setAddingPresetId(preset.id);
    setAddedPresetId(null);

    try {
      await addPreset(preset, mealType);
      setAddedPresetId(preset.id);
      setTimeout(() => setAddedPresetId(null), 2000);
    } catch {
      // Error surfaced via store
    } finally {
      setAddingPresetId(null);
    }
  }

  async function handleDeletePreset(id: number) {
    setDeletingId(id);
    try {
      await deletePreset(id);
    } catch {
      // Error surfaced via store
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSaveFromLog() {
    if (!saveFromLogName.trim()) return;

    setSaveFromLogSaving(true);
    try {
      await savePresetFromDay(saveFromLogName.trim(), todayIso, saveFromLogMeal);
      setSaveFromLogName("");
      setSaveFromLogOpen(false);
    } catch {
      // Error surfaced via store
    } finally {
      setSaveFromLogSaving(false);
    }
  }

  if (!available) {
    return null;
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
        <h2 className="font-heading text-base font-semibold text-text-primary">
          Your Meals
        </h2>
        <p className="mt-2 text-sm text-text-secondary">Loading meals…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-text-primary">
            Your Meals
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Meals built in{" "}
            <Link
              href="/meal-builder"
              className="font-medium text-primary hover:underline"
            >
              Meal Builder
            </Link>
            . Add a full meal to your dashboard in one tap.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSaveFromLogOpen((v) => !v)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-neutral-50"
        >
          Save from today
        </button>
      </div>

      {saveFromLogOpen && (
        <div className="mt-4 rounded-lg border border-border/60 bg-neutral-50/80 p-4">
          <p className="text-sm font-medium text-text-primary">
            Save today&apos;s meal
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="min-w-[140px] flex-1">
              <label className="text-xs text-text-muted" htmlFor="save-meal-name">
                Meal name
              </label>
              <input
                id="save-meal-name"
                type="text"
                value={saveFromLogName}
                onChange={(e) => setSaveFromLogName(e.target.value)}
                placeholder="My usual breakfast"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <MealTypeDropdown
              value={saveFromLogMeal}
              onChange={setSaveFromLogMeal}
            />
            <button
              type="button"
              onClick={() => void handleSaveFromLog()}
              disabled={
                saveFromLogSaving ||
                !saveFromLogName.trim() ||
                meals[saveFromLogMeal].length === 0
              }
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saveFromLogSaving ? "Saving…" : "Save meal"}
            </button>
          </div>
          {meals[saveFromLogMeal].length === 0 && (
            <p className="mt-2 text-xs text-text-muted">
              No {saveFromLogMeal} items logged today yet.
            </p>
          )}
        </div>
      )}

      {presets.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          No saved meals yet.{" "}
          <Link href="/meal-builder" className="text-primary hover:underline">
            Build one in Meal Builder
          </Link>
          , or save today&apos;s log above.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {presets.map((preset) => {
            const mealType = getPresetMeal(preset);
            const itemSummary = preset.items
              .map(
                (item) =>
                  `${item.servings} ${item.servingLabel} ${item.food.name}`,
              )
              .join(", ");

            return (
              <li
                key={preset.id}
                className="rounded-lg border border-border/60 bg-neutral-50/80 px-3 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {preset.name}
                      </span>
                      <span className="rounded-full bg-primary-subtle px-2 py-0.5 font-mono text-xs text-primary">
                        {preset.totalCalories} kcal
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs capitalize text-text-muted">
                      {itemSummary}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <MealTypeDropdown
                      value={mealType}
                      onChange={(meal) =>
                        setPresetMeals((prev) => ({
                          ...prev,
                          [preset.id]: meal,
                        }))
                      }
                      compact
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddPreset(preset)}
                      disabled={addingPresetId === preset.id}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        addedPresetId === preset.id
                          ? "bg-green-50 text-green-700"
                          : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      {addingPresetId === preset.id
                        ? "Adding…"
                        : addedPresetId === preset.id
                          ? "Added ✓"
                          : "Add meal"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeletePreset(preset.id)}
                      disabled={deletingId === preset.id}
                      aria-label={`Delete meal ${preset.name}`}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === preset.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
