"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MealTypeDropdown } from "@/components/food/MealTypeDropdown";
import type { FoodRecord, FoodSearchResponse } from "@/lib/food-search-types";
import { foodRecordToNutrients } from "@/lib/food-mapper";
import type { MealType } from "@/lib/meals";
import { parseFoodInput } from "@/lib/parse-food-input";
import type { BuiltMealItemInput, MealPreset } from "@/lib/presets-types";
import { scaleNutrients, type ScaledNutrients } from "@/lib/scale-nutrients";
import { useDashboardStore } from "@/store/useDashboardStore";

interface MealBuilderProps {
  presets: MealPreset[];
  loading?: boolean;
}

interface BuilderItem extends BuiltMealItemInput {
  key: string;
  price: number | null;
}

const DEFAULT_MEAL_TYPE: MealType = "breakfast";

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

export function MealBuilder({ presets, loading = false }: MealBuilderProps) {
  const { saveBuiltMeal, deletePreset, addPreset } = useDashboardStore();

  const [items, setItems] = useState<BuilderItem[]>([]);
  const [mealName, setMealName] = useState("");
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FoodRecord[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<FoodSearchResponse | null>(
    null,
  );
  const [itemPrice, setItemPrice] = useState("");
  const suggestRef = useRef<HTMLDivElement>(null);

  const [presetMeals, setPresetMeals] = useState<Record<number, MealType>>({});
  const [addingPresetId, setAddingPresetId] = useState<number | null>(null);
  const [addedPresetId, setAddedPresetId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    const { foodName } = parseFoodInput(q);
    const normalizedName = foodName.toLowerCase().trim();

    if (!normalizedName || normalizedName.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }

    setSuggestLoading(true);

    try {
      const res = await fetch(`/api/food/suggest?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!res.ok) {
        setSuggestions([]);
        setSuggestOpen(false);
        return;
      }

      const nextSuggestions = (data.suggestions ?? []) as FoodRecord[];
      setSuggestions(nextSuggestions);
      setSuggestOpen(nextSuggestions.length > 0);
    } catch {
      setSuggestions([]);
      setSuggestOpen(false);
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  const runSearch = useCallback(async (q: string, foodId?: number) => {
    if (!q) {
      setSearchResult(null);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSuggestOpen(false);

    try {
      const params = new URLSearchParams({ q });
      if (foodId != null) {
        params.set("id", String(foodId));
      }

      const res = await fetch(`/api/food/search?${params.toString()}`);
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
  }, []);

  useEffect(() => {
    setSearchResult(null);
    setSearchError(null);
    void fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  useEffect(() => {
    setItemPrice("");
  }, [searchResult]);

  const totals = useMemo(() => sumScaledNutrients(items), [items]);
  const totalPrice = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.price ?? 0),
        0,
      ),
    [items],
  );

  const { foodName } = parseFoodInput(searchQuery);
  const normalizedFoodName = foodName.toLowerCase().trim();
  const canLookup = normalizedFoodName.length >= 2 && !searchLoading;
  const showSuggestDropdown =
    suggestOpen && normalizedFoodName.length >= 2 && suggestions.length > 0;

  function addSearchItem() {
    if (!searchResult) return;

    const trimmedPrice = itemPrice.trim();
    const parsedPrice = trimmedPrice ? parseFloat(trimmedPrice) : null;
    const price =
      parsedPrice != null && Number.isFinite(parsedPrice) && parsedPrice >= 0
        ? parsedPrice
        : null;

    setItems((prev) => [
      ...prev,
      {
        key: `${searchResult.food.name}-${Date.now()}-${prev.length}`,
        food: searchResult.food,
        quantity: searchResult.quantity,
        unit: searchResult.unit ?? searchResult.food.servingUnit,
        price,
      },
    ]);
    setSearchQuery("");
    setDebouncedQuery("");
    setSearchResult(null);
    setItemPrice("");
    setSuggestions([]);
    setSuggestOpen(false);
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
        DEFAULT_MEAL_TYPE,
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

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-soft">
        <h2 className="font-heading text-base font-semibold text-text-primary">
          Build a meal
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Search foods and group them into one meal for quick, one-tap logging.
        </p>

        <div className="mt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1" ref={suggestRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0 && normalizedFoodName.length >= 2) {
                    setSuggestOpen(true);
                  }
                }}
                placeholder='Search food, e.g. "2 eggs"'
                className="w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoComplete="off"
              />

              {showSuggestDropdown && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                  {suggestions.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => void runSearch(searchQuery.trim(), food.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary-subtle"
                    >
                      <span className="font-medium capitalize text-text-primary">
                        {food.name}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-text-muted">
                        {food.servingSize} {food.servingUnit} ·{" "}
                        {Math.round(food.calories)} kcal
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => void runSearch(searchQuery.trim())}
              disabled={!canLookup}
              className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {searchLoading ? "Looking up…" : "Look up"}
            </button>
          </div>

          {suggestLoading && !searchLoading && (
            <p className="mt-2 text-xs text-text-secondary">
              Searching cached foods…
            </p>
          )}
          {searchError && (
            <p className="mt-2 text-xs text-red-600">{searchError}</p>
          )}
          {searchResult && !searchLoading && (
            <div className="mt-3 rounded-xl border border-border bg-neutral-50/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium capitalize text-text-primary">
                    {searchResult.food.name}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {searchResult.quantity}
                    {searchResult.unit ? ` ${searchResult.unit}` : ""} ·{" "}
                    {searchResult.cached ? "From cache" : "Looked up"}
                  </p>
                </div>
                <span className="rounded-full bg-primary-subtle px-3 py-1 font-mono text-xs font-medium text-primary">
                  {Math.round(searchResult.scaledNutrients.calories)} kcal
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  {
                    label: "Protein",
                    value: searchResult.scaledNutrients.protein,
                    unit: "g",
                  },
                  {
                    label: "Carbs",
                    value: searchResult.scaledNutrients.carbs,
                    unit: "g",
                  },
                  {
                    label: "Fat",
                    value: searchResult.scaledNutrients.fat,
                    unit: "g",
                  },
                  {
                    label: "Sugar",
                    value: searchResult.scaledNutrients.sugar,
                    unit: "g",
                  },
                  {
                    label: "Sodium",
                    value: searchResult.scaledNutrients.sodium,
                    unit: "mg",
                  },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="rounded-lg bg-surface px-3 py-2">
                    <dt className="text-xs text-text-muted">{label}</dt>
                    <dd className="font-mono text-sm font-medium text-text-primary">
                      {value != null ? `${value.toFixed(1)} ${unit}` : "—"}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3">
                <label htmlFor="item-price" className="text-xs text-text-muted">
                  Price (optional)
                </label>
                <input
                  id="item-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-40"
                />
              </div>

              <button
                type="button"
                onClick={addSearchItem}
                className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                Add item
              </button>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <>
            <ul className="mt-4 space-y-2">
              {items.map((item, index) => (
                <li
                  key={item.key}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-neutral-50/80 px-3 py-2 text-sm"
                >
                  <span className="flex-1 capitalize">{item.food.name}</span>
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
                  {item.price != null && (
                    <span className="font-mono text-xs text-text-muted">
                      ${item.price.toFixed(2)}
                    </span>
                  )}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Meal totals
                </p>
                <span className="rounded-full bg-primary-subtle px-3 py-1 font-mono text-sm font-medium text-primary">
                  {Math.round(totals.calories)} kcal
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { label: "Protein", value: totals.protein, unit: "g" },
                  { label: "Carbs", value: totals.carbs, unit: "g" },
                  { label: "Fat", value: totals.fat, unit: "g" },
                  { label: "Sugar", value: totals.sugar, unit: "g" },
                  { label: "Sodium", value: totals.sodium, unit: "mg" },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="rounded-lg bg-surface/80 px-3 py-2">
                    <dt className="text-xs text-text-muted">{label}</dt>
                    <dd className="font-mono text-sm font-medium text-text-primary">
                      {value != null ? `${value.toFixed(1)} ${unit}` : "—"}
                    </dd>
                  </div>
                ))}
              </dl>
              {totalPrice > 0 && (
                <p className="mt-3 font-mono text-sm font-medium text-text-primary">
                  Total price: ${totalPrice.toFixed(2)}
                </p>
              )}
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
          Pick a time and add a saved meal to your day. Meals also appear on Add
          Food for one-tap adding.
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

                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
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
    </div>
  );
}
