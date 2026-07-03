"use client";

import { useEffect, useMemo, useState } from "react";

import { MealTypeDropdown } from "@/components/food/MealTypeDropdown";
import type { FoodRecord, FoodSearchResponse } from "@/lib/food-search-types";
import { foodRecordToNutrients } from "@/lib/food-mapper";
import type { MealType } from "@/lib/meals";
import type { BuiltMealItemInput, MealPreset } from "@/lib/presets-types";
import { scaleNutrients, type ScaledNutrients } from "@/lib/scale-nutrients";
import { useDashboardStore } from "@/store/useDashboardStore";

interface MealBuilderProps {
  presets: MealPreset[];
  loading?: boolean;
}

interface BuilderItem extends BuiltMealItemInput {
  key: string;
}

type AddMode = "search" | "manual";

interface ManualFormState {
  name: string;
  quantity: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
  saturatedFat: string;
}

const EMPTY_MANUAL: ManualFormState = {
  name: "",
  quantity: "1",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  sugar: "",
  sodium: "",
  saturatedFat: "",
};

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function sumScaledNutrients(items: BuilderItem[]): ScaledNutrients {
  const totals: ScaledNutrients = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    saturatedFat: 0,
    transFat: null,
    cholesterol: null,
    potassium: null,
    calcium: null,
    iron: null,
  };

  for (const item of items) {
    const scaled = scaleNutrients(
      foodRecordToNutrients(item.food),
      item.quantity,
      item.unit,
    );
    totals.calories += scaled.calories;
    totals.protein += scaled.protein;
    totals.carbs += scaled.carbs;
    totals.fat += scaled.fat;
    totals.fiber = (totals.fiber ?? 0) + (scaled.fiber ?? 0);
    totals.sugar = (totals.sugar ?? 0) + (scaled.sugar ?? 0);
    totals.sodium = (totals.sodium ?? 0) + (scaled.sodium ?? 0);
    totals.saturatedFat =
      (totals.saturatedFat ?? 0) + (scaled.saturatedFat ?? 0);
  }

  return totals;
}

function createManualFoodRecord(form: ManualFormState): FoodRecord | null {
  const name = form.name.trim();
  const calories = parseFloat(form.calories);
  const protein = parseFloat(form.protein);
  const carbs = parseFloat(form.carbs);
  const fat = parseFloat(form.fat);

  if (
    !name ||
    !Number.isFinite(calories) ||
    !Number.isFinite(protein) ||
    !Number.isFinite(carbs) ||
    !Number.isFinite(fat)
  ) {
    return null;
  }

  return {
    id: 0,
    name,
    servingSize: 1,
    servingUnit: "serving",
    calories,
    protein,
    carbs,
    fat,
    fiber: parseOptionalNumber(form.fiber),
    sugar: parseOptionalNumber(form.sugar),
    sodium: parseOptionalNumber(form.sodium),
    saturatedFat: parseOptionalNumber(form.saturatedFat),
    transFat: null,
    cholesterol: null,
    potassium: null,
    calcium: null,
    iron: null,
    source: "manual",
    createdAt: new Date(0).toISOString(),
  };
}

export function MealBuilder({ presets, loading = false }: MealBuilderProps) {
  const { saveBuiltMeal, deletePreset } = useDashboardStore();

  const [addMode, setAddMode] = useState<AddMode>("search");
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<FoodSearchResponse | null>(
    null,
  );

  const [manualForm, setManualForm] = useState<ManualFormState>(EMPTY_MANUAL);

  useEffect(() => {
    if (addMode !== "search") return;

    const timer = setTimeout(async () => {
      const q = searchQuery.trim();
      if (!q) {
        setSearchResult(null);
        setSearchError(null);
        return;
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        const res = await fetch(`/api/food/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) {
          setSearchResult(null);
          setSearchError(data.error ?? "Search failed");
          return;
        }
        setSearchResult(data as FoodSearchResponse);
      } catch {
        setSearchResult(null);
        setSearchError("Could not reach the food search API");
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, addMode]);

  const totals = useMemo(() => sumScaledNutrients(items), [items]);

  function addSearchItem() {
    if (!searchResult) return;

    setItems((prev) => [
      ...prev,
      {
        key: `${searchResult.food.name}-${Date.now()}-${prev.length}`,
        food: searchResult.food,
        quantity: searchResult.quantity,
        unit: searchResult.unit ?? searchResult.food.servingUnit,
      },
    ]);
    setSearchQuery("");
    setSearchResult(null);
  }

  function addManualItem() {
    const food = createManualFoodRecord(manualForm);
    if (!food) return;

    const quantity = parseFloat(manualForm.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    setItems((prev) => [
      ...prev,
      {
        key: `${food.name}-${Date.now()}-${prev.length}`,
        food,
        quantity,
        unit: food.servingUnit,
      },
    ]);
    setManualForm(EMPTY_MANUAL);
  }

  function updateItemQuantity(index: number, quantity: string) {
    const parsed = parseFloat(quantity);
    if (!Number.isFinite(parsed) || parsed <= 0) return;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: parsed } : item,
      ),
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveMeal() {
    if (!mealName.trim() || items.length === 0) return;

    setSaving(true);
    try {
      await saveBuiltMeal(
        mealName.trim(),
        mealType,
        items.map(({ food, quantity, unit }) => ({ food, quantity, unit })),
      );
      setItems([]);
      setMealName("");
    } catch {
      // Error surfaced via store
    } finally {
      setSaving(false);
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

  const manualPreview = createManualFoodRecord(manualForm);
  const manualQuantity = parseFloat(manualForm.quantity);
  const manualValid =
    manualPreview !== null &&
    Number.isFinite(manualQuantity) &&
    manualQuantity > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-soft">
        <h2 className="font-heading text-base font-semibold text-text-primary">
          Build a meal
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Add items via Gemini search or enter macros manually, then save the
          meal for quick logging.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setAddMode("search")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              addMode === "search"
                ? "bg-primary text-white"
                : "border border-border bg-surface text-text-primary hover:bg-neutral-50"
            }`}
          >
            Search (Gemini)
          </button>
          <button
            type="button"
            onClick={() => setAddMode("manual")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              addMode === "manual"
                ? "bg-primary text-white"
                : "border border-border bg-surface text-text-primary hover:bg-neutral-50"
            }`}
          >
            Manual entry
          </button>
        </div>

        {addMode === "search" ? (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search food, e.g. "2 eggs"'
                className="min-w-[200px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={addSearchItem}
                disabled={!searchResult || searchLoading}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add item
              </button>
            </div>
            {searchLoading && (
              <p className="mt-2 text-xs text-text-secondary">Looking up…</p>
            )}
            {searchError && (
              <p className="mt-2 text-xs text-red-600">{searchError}</p>
            )}
            {searchResult && !searchLoading && (
              <p className="mt-2 text-xs text-text-secondary">
                Found: {searchResult.food.name} · {searchResult.quantity}
                {searchResult.unit ? ` ${searchResult.unit}` : ""} ·{" "}
                {Math.round(searchResult.scaledNutrients.calories)} kcal
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs text-text-muted" htmlFor="manual-name">
                  Item name
                </label>
                <input
                  id="manual-name"
                  type="text"
                  value={manualForm.name}
                  onChange={(e) =>
                    setManualForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Grilled chicken breast"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label
                  className="text-xs text-text-muted"
                  htmlFor="manual-quantity"
                >
                  Servings
                </label>
                <input
                  id="manual-quantity"
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={manualForm.quantity}
                  onChange={(e) =>
                    setManualForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div />
              {(
                [
                  ["calories", "Calories (kcal)"],
                  ["protein", "Protein (g)"],
                  ["carbs", "Carbs (g)"],
                  ["fat", "Fat (g)"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-text-muted" htmlFor={`manual-${key}`}>
                    {label}
                  </label>
                  <input
                    id={`manual-${key}`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={manualForm[key]}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              ))}
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-text-muted">
                Optional micros
              </summary>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["fiber", "Fiber (g)"],
                    ["sugar", "Sugar (g)"],
                    ["sodium", "Sodium (mg)"],
                    ["saturatedFat", "Saturated fat (g)"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label
                      className="text-xs text-text-muted"
                      htmlFor={`manual-${key}`}
                    >
                      {label}
                    </label>
                    <input
                      id={`manual-${key}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={manualForm[key]}
                      onChange={(e) =>
                        setManualForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                ))}
              </div>
            </details>
            <button
              type="button"
              onClick={addManualItem}
              disabled={!manualValid}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add item
            </button>
          </div>
        )}

        {items.length > 0 && (
          <>
            <ul className="mt-4 space-y-2">
              {items.map((item, index) => (
                <li
                  key={item.key}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-neutral-50/80 px-3 py-2 text-sm"
                >
                  <span className="flex-1 capitalize">{item.food.name}</span>
                  {item.food.source === "manual" && (
                    <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-text-muted">
                      manual
                    </span>
                  )}
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(index, e.target.value)}
                    className="w-16 rounded-lg border border-border px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-text-muted">
                    {item.unit ?? item.food.servingUnit}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg border border-border/60 bg-primary-subtle/40 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Meal totals
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <span>{Math.round(totals.calories)} kcal</span>
                <span>P {Math.round(totals.protein)}g</span>
                <span>C {Math.round(totals.carbs)}g</span>
                <span>F {Math.round(totals.fat)}g</span>
              </div>
            </div>
          </>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border/60 pt-4">
          <div className="min-w-[140px] flex-1">
            <label className="text-xs text-text-muted" htmlFor="meal-name">
              Meal name
            </label>
            <input
              id="meal-name"
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="Weekday breakfast"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <MealTypeDropdown value={mealType} onChange={setMealType} />
          <button
            type="button"
            onClick={() => void handleSaveMeal()}
            disabled={saving || !mealName.trim() || items.length === 0}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save meal"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
        <h2 className="font-heading text-base font-semibold text-text-primary">
          Saved meals
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Meals you save here also appear on the Log page for one-tap adding.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-text-secondary">Loading meals…</p>
        ) : presets.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">
            No saved meals yet. Build one above to get started.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {presets.map((preset) => {
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
                        <span className="text-xs capitalize text-text-muted">
                          {preset.mealType}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs capitalize text-text-muted">
                        {itemSummary}
                      </p>
                    </div>
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
