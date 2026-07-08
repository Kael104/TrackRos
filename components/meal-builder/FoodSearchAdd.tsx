"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CountModeToggle } from "@/components/food/CountModeToggle";
import { buildFinalizedSearchResponse } from "@/lib/build-food-search-response";
import type { FoodRecord, FoodSearchResponse } from "@/lib/food-search-types";
import { parseFoodInput } from "@/lib/parse-food-input";
import {
  defaultCountMode,
  formatAddQuantityLabel,
  type CountMode,
} from "@/lib/serving-units";

export interface FoodSearchAddItem {
  food: FoodRecord;
  quantity: number;
  unit: string | null;
  price: number | null;
}

interface FoodSearchAddProps {
  onAdd: (item: FoodSearchAddItem) => void;
  priceInputId?: string;
}

interface SearchBase {
  food: FoodRecord;
  quantity: number;
  unit: string | null;
  cached: boolean;
}

export function FoodSearchAdd({ onAdd, priceInputId = "item-price" }: FoodSearchAddProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FoodRecord[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchBase, setSearchBase] = useState<SearchBase | null>(null);
  const [countMode, setCountMode] = useState<CountMode>("piece");
  const [itemPrice, setItemPrice] = useState("");
  const suggestRef = useRef<HTMLDivElement>(null);

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
      setSearchBase(null);
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
        setSearchBase(null);
        setSearchError(data.error ?? "Search failed");
        return;
      }

      const searchResult = data as FoodSearchResponse;
      const { quantity, unit } = parseFoodInput(q);
      setSearchBase({
        food: searchResult.food,
        quantity,
        unit,
        cached: searchResult.cached,
      });
      setCountMode(
        searchResult.countMode ?? defaultCountMode(searchResult.food.servingUnit),
      );
    } catch {
      setSearchBase(null);
      setSearchError("Could not reach the food search API");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    setSearchBase(null);
    setSearchError(null);
    void fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  const searchResult = useMemo<FoodSearchResponse | null>(() => {
    if (!searchBase) return null;
    return buildFinalizedSearchResponse(
      searchBase.food,
      searchBase.quantity,
      searchBase.unit,
      searchBase.cached,
      countMode,
      searchBase.food.piecesPerServing,
    );
  }, [searchBase, countMode]);

  useEffect(() => {
    setItemPrice("");
  }, [searchBase, countMode]);

  const { foodName } = parseFoodInput(searchQuery);
  const normalizedFoodName = foodName.toLowerCase().trim();
  const canLookup = normalizedFoodName.length >= 2 && !searchLoading;
  const showSuggestDropdown =
    suggestOpen && normalizedFoodName.length >= 2 && suggestions.length > 0;

  function handleAddItem() {
    if (!searchResult) return;

    const trimmedPrice = itemPrice.trim();
    const parsedPrice = trimmedPrice ? parseFloat(trimmedPrice) : null;
    const price =
      parsedPrice != null && Number.isFinite(parsedPrice) && parsedPrice >= 0
        ? parsedPrice
        : null;

    onAdd({
      food: searchResult.food,
      quantity: searchResult.quantity,
      unit: searchResult.servingLabel,
      price,
    });

    setSearchQuery("");
    setDebouncedQuery("");
    setSearchBase(null);
    setItemPrice("");
    setSuggestions([]);
    setSuggestOpen(false);
  }

  return (
    <div>
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
                {formatAddQuantityLabel(
                  searchResult.quantity,
                  searchResult.servingLabel,
                )}{" "}
                · {searchResult.cached ? "From cache" : "Looked up"}
              </p>
            </div>
            <span className="rounded-full bg-primary-subtle px-3 py-1 font-mono text-xs font-medium text-primary">
              {Math.round(searchResult.scaledNutrients.calories)} kcal
            </span>
          </div>

          {searchResult.supportsCountModeChoice && searchResult.countMode && (
            <CountModeToggle
              value={searchResult.countMode}
              piecesPerServing={searchResult.piecesPerServing}
              onChange={setCountMode}
            />
          )}

          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <p className="col-span-full text-xs font-medium text-text-muted">
              Nutrients per{" "}
              {formatAddQuantityLabel(
                searchResult.quantity,
                searchResult.servingLabel,
              )}
            </p>
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
            <label htmlFor={priceInputId} className="text-xs text-text-muted">
              Price (optional)
            </label>
            <input
              id={priceInputId}
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
            onClick={handleAddItem}
            className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Add item
          </button>
        </div>
      )}
    </div>
  );
}
