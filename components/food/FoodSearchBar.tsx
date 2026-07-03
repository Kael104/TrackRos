"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FoodRecord, FoodSearchResponse } from "@/lib/food-search-types";
import { MEAL_CONFIG, type MealType } from "@/lib/meals";
import { parseFoodInput } from "@/lib/parse-food-input";
import { formatAddQuantityLabel } from "@/lib/serving-units";

interface FoodSearchBarProps {
  onResult?: (result: FoodSearchResponse) => void;
  onAddToDashboard?: (
    result: FoodSearchResponse,
    mealType: MealType,
  ) => Promise<void>;
}

const MEAL_TYPES = Object.keys(MEAL_CONFIG) as MealType[];

export function FoodSearchBar({ onResult, onAddToDashboard }: FoodSearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FoodRecord[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FoodSearchResponse | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealType>("breakfast");
  const [mealOpen, setMealOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);
  const mealDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setAdded(false);
  }, [result]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
      if (
        mealDropdownRef.current &&
        !mealDropdownRef.current.contains(e.target as Node)
      ) {
        setMealOpen(false);
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

  const runSearch = useCallback(
    async (q: string, foodId?: number) => {
      if (!q) {
        setResult(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      setSuggestOpen(false);

      try {
        const params = new URLSearchParams({ q });
        if (foodId != null) {
          params.set("id", String(foodId));
        }

        const res = await fetch(`/api/food/search?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          setResult(null);
          setError(data.error ?? "Search failed");
          return;
        }

        const searchResult = data as FoodSearchResponse;
        setResult(searchResult);
        onResult?.(searchResult);
      } catch {
        setResult(null);
        setError("Could not reach the food search API");
      } finally {
        setLoading(false);
      }
    },
    [onResult],
  );

  useEffect(() => {
    setResult(null);
    setError(null);
    void fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  async function handleSelectSuggestion(food: FoodRecord) {
    await runSearch(query.trim(), food.id);
  }

  async function handleLookup() {
    await runSearch(query.trim());
  }

  async function handleAdd() {
    if (!result || !onAddToDashboard) return;
    try {
      await onAddToDashboard(result, selectedMeal);
      setAdded(true);
    } catch {
      // Error surfaced via dashboard store
    }
  }

  const { foodName } = parseFoodInput(query);
  const normalizedFoodName = foodName.toLowerCase().trim();
  const canLookup = normalizedFoodName.length >= 2 && !loading;
  const showSuggestDropdown =
    suggestOpen && normalizedFoodName.length >= 2 && suggestions.length > 0;

  const hasResult = result !== null && !loading;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="food-search" className="sr-only">
          Search food
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1" ref={suggestRef}>
            <input
              id="food-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0 && normalizedFoodName.length >= 2) {
                  setSuggestOpen(true);
                }
              }}
              placeholder='Try "3 pc fried chicken" or "banana"'
              className="min-w-0 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary shadow-soft placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoComplete="off"
            />

            {showSuggestDropdown && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                {suggestions.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => void handleSelectSuggestion(food)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary-subtle"
                  >
                    <span className="font-medium capitalize text-text-primary">
                      {food.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-text-muted">
                      {food.servingSize} {food.servingUnit} · {Math.round(food.calories)} kcal
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className="relative flex w-full shrink-0 items-stretch sm:w-auto"
            ref={mealDropdownRef}
          >
            <button
              type="button"
              onClick={() => void handleLookup()}
              disabled={!canLookup}
              className="flex-1 rounded-l-xl border border-r-0 border-border bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              {loading ? "Looking up…" : "Look up"}
            </button>
            <button
              type="button"
              onClick={() => setMealOpen((o) => !o)}
              aria-label="Select meal"
              className="flex-1 rounded-r-xl border border-border bg-primary px-3 py-3 text-sm text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:flex-none"
            >
              <span className="capitalize">{selectedMeal}</span>
              <svg
                className="ml-1 inline-block h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mealOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[130px] overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                {MEAL_TYPES.map((meal) => (
                  <button
                    key={meal}
                    type="button"
                    onClick={() => {
                      setSelectedMeal(meal);
                      setMealOpen(false);
                    }}
                    className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary-subtle ${
                      selectedMeal === meal
                        ? "font-medium text-primary"
                        : "text-text-primary"
                    }`}
                  >
                    <span
                      className="mr-2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: MEAL_CONFIG[meal].accentColor }}
                    />
                    {MEAL_CONFIG[meal].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Include quantity and unit if you know them, e.g. 1 cup oatmeal. Pick a cached
          food from suggestions or use Look up to fetch new nutrients.
        </p>
      </div>

      {suggestLoading && !loading && (
        <p className="text-sm text-text-secondary">Searching cached foods…</p>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-heading text-lg font-semibold capitalize text-text-primary">
                {result.food.name}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {formatAddQuantityLabel(result.quantity, result.servingLabel)} ·{" "}
                {result.cached ? "From cache" : "Looked up"}
              </p>
            </div>
            <span className="rounded-full bg-primary-subtle px-3 py-1 font-mono text-sm font-medium text-primary">
              {Math.round(result.scaledNutrients.calories)} kcal
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Protein", value: result.scaledNutrients.protein, unit: "g" },
              { label: "Carbs", value: result.scaledNutrients.carbs, unit: "g" },
              { label: "Fat", value: result.scaledNutrients.fat, unit: "g" },
              { label: "Fiber", value: result.scaledNutrients.fiber, unit: "g" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="rounded-lg bg-neutral-50 px-3 py-2">
                <dt className="text-xs text-text-muted">{label}</dt>
                <dd className="font-mono text-sm font-medium text-text-primary">
                  {value != null ? `${value.toFixed(1)} ${unit}` : "—"}
                </dd>
              </div>
            ))}
          </dl>

          {onAddToDashboard && (
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!hasResult}
              className={`mt-4 w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto ${
                added
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-border bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {added ? "Added ✓" : "Add to Dashboard"}
            </button>
          )}

          {added && (
            <p className="mt-4 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
              Added to <span className="capitalize">{selectedMeal}</span> on the dashboard.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
