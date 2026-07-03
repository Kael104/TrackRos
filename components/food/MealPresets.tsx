"use client";

import { useEffect, useState } from "react";

import { MealTypeDropdown } from "@/components/food/MealTypeDropdown";
import type { FoodSearchResponse } from "@/lib/food-search-types";
import type { MealType } from "@/lib/meals";
import type { MealPreset } from "@/lib/presets-types";
import { useDashboardStore } from "@/store/useDashboardStore";

interface MealPresetsProps {
  presets: MealPreset[];
  loading?: boolean;
  available?: boolean;
  todayIso: string;
}

interface BuilderItem {
  food: FoodSearchResponse["food"];
  quantity: number;
  unit: string | null;
}

export function MealPresets({
  presets,
  loading = false,
  available = true,
  todayIso,
}: MealPresetsProps) {
  const {
    addPreset,
    deletePreset,
    savePreset,
    savePresetFromDay,
    meals,
  } = useDashboardStore();

  const [presetMeals, setPresetMeals] = useState<Record<number, MealType>>({});
  const [addingPresetId, setAddingPresetId] = useState<number | null>(null);
  const [addedPresetId, setAddedPresetId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showBuilder, setShowBuilder] = useState(false);
  const [builderQuery, setBuilderQuery] = useState("");
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [builderResult, setBuilderResult] = useState<FoodSearchResponse | null>(
    null,
  );
  const [builderItems, setBuilderItems] = useState<BuilderItem[]>([]);
  const [builderName, setBuilderName] = useState("");
  const [builderMealType, setBuilderMealType] = useState<MealType>("breakfast");
  const [builderSaving, setBuilderSaving] = useState(false);

  const [saveFromLogOpen, setSaveFromLogOpen] = useState(false);
  const [saveFromLogMeal, setSaveFromLogMeal] = useState<MealType>("breakfast");
  const [saveFromLogName, setSaveFromLogName] = useState("");
  const [saveFromLogSaving, setSaveFromLogSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = builderQuery.trim();
      if (!q) {
        setBuilderResult(null);
        setBuilderError(null);
        return;
      }

      setBuilderLoading(true);
      setBuilderError(null);

      try {
        const res = await fetch(`/api/food/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) {
          setBuilderResult(null);
          setBuilderError(data.error ?? "Search failed");
          return;
        }
        setBuilderResult(data as FoodSearchResponse);
      } catch {
        setBuilderResult(null);
        setBuilderError("Could not reach the food search API");
      } finally {
        setBuilderLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [builderQuery]);

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

  function addBuilderItem() {
    if (!builderResult) return;

    setBuilderItems((prev) => [
      ...prev,
      {
        food: builderResult.food,
        quantity: builderResult.quantity,
        unit: builderResult.unit ?? builderResult.food.servingUnit,
      },
    ]);
    setBuilderQuery("");
    setBuilderResult(null);
  }

  function updateBuilderItemQuantity(index: number, quantity: string) {
    const parsed = parseFloat(quantity);
    if (!Number.isFinite(parsed) || parsed <= 0) return;

    setBuilderItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: parsed } : item,
      ),
    );
  }

  function removeBuilderItem(index: number) {
    setBuilderItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveBuilder() {
    if (!builderName.trim() || builderItems.length === 0) return;

    setBuilderSaving(true);
    try {
      await savePreset(
        builderName.trim(),
        builderMealType,
        builderItems.map((item) => ({
          foodId: item.food.id,
          servings: item.quantity,
          servingLabel: item.unit ?? item.food.servingUnit,
        })),
      );
      setBuilderItems([]);
      setBuilderName("");
      setBuilderQuery("");
      setShowBuilder(false);
    } catch {
      // Error surfaced via store
    } finally {
      setBuilderSaving(false);
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
          Meal Presets
        </h2>
        <p className="mt-2 text-sm text-text-secondary">Loading presets…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-text-primary">
            Meal Presets
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Add a full meal in one tap, or save your usual combinations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowBuilder((v) => !v)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-neutral-50"
          >
            {showBuilder ? "Close builder" : "New preset"}
          </button>
          <button
            type="button"
            onClick={() => setSaveFromLogOpen((v) => !v)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-neutral-50"
          >
            Save from today
          </button>
        </div>
      </div>

      {saveFromLogOpen && (
        <div className="mt-4 rounded-lg border border-border/60 bg-neutral-50/80 p-4">
          <p className="text-sm font-medium text-text-primary">
            Save today&apos;s meal as a preset
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="min-w-[140px] flex-1">
              <label className="text-xs text-text-muted" htmlFor="save-preset-name">
                Preset name
              </label>
              <input
                id="save-preset-name"
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
              {saveFromLogSaving ? "Saving…" : "Save preset"}
            </button>
          </div>
          {meals[saveFromLogMeal].length === 0 && (
            <p className="mt-2 text-xs text-text-muted">
              No {saveFromLogMeal} items logged today yet.
            </p>
          )}
        </div>
      )}

      {showBuilder && (
        <div className="mt-4 rounded-lg border border-border/60 bg-neutral-50/80 p-4">
          <p className="text-sm font-medium text-text-primary">
            Build a new meal preset
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="text"
              value={builderQuery}
              onChange={(e) => setBuilderQuery(e.target.value)}
              placeholder='Search food, e.g. "2 eggs"'
              className="min-w-[200px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={addBuilderItem}
              disabled={!builderResult || builderLoading}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to preset
            </button>
          </div>

          {builderLoading && (
            <p className="mt-2 text-xs text-text-secondary">Looking up…</p>
          )}
          {builderError && (
            <p className="mt-2 text-xs text-red-600">{builderError}</p>
          )}
          {builderResult && !builderLoading && (
            <p className="mt-2 text-xs text-text-secondary">
              Found: {builderResult.food.name} · {builderResult.quantity}
              {builderResult.unit ? ` ${builderResult.unit}` : ""} ·{" "}
              {Math.round(builderResult.scaledNutrients.calories)} kcal
            </p>
          )}

          {builderItems.length > 0 && (
            <ul className="mt-3 space-y-2">
              {builderItems.map((item, index) => (
                <li
                  key={`${item.food.id}-${index}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm"
                >
                  <span className="flex-1 capitalize">{item.food.name}</span>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={item.quantity}
                    onChange={(e) =>
                      updateBuilderItemQuantity(index, e.target.value)
                    }
                    className="w-16 rounded-lg border border-border px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-text-muted">
                    {item.unit ?? item.food.servingUnit}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeBuilderItem(index)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div className="min-w-[140px] flex-1">
              <label className="text-xs text-text-muted" htmlFor="builder-name">
                Preset name
              </label>
              <input
                id="builder-name"
                type="text"
                value={builderName}
                onChange={(e) => setBuilderName(e.target.value)}
                placeholder="Weekday breakfast"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <MealTypeDropdown
              value={builderMealType}
              onChange={setBuilderMealType}
            />
            <button
              type="button"
              onClick={() => void handleSaveBuilder()}
              disabled={
                builderSaving ||
                !builderName.trim() ||
                builderItems.length === 0
              }
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {builderSaving ? "Saving…" : "Save preset"}
            </button>
          </div>
        </div>
      )}

      {presets.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          No meal presets yet. Save today&apos;s meal or build one above.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {presets.map((preset) => {
            const mealType = getPresetMeal(preset);
            const itemSummary = preset.items
              .map((item) => `${item.servings} ${item.servingLabel} ${item.food.name}`)
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
                        setPresetMeals((prev) => ({ ...prev, [preset.id]: meal }))
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
                      aria-label={`Delete preset ${preset.name}`}
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
