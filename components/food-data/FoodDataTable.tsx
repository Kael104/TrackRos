"use client";

import { useMemo, useState } from "react";

import type { FoodRecord } from "@/lib/food-search-types";
import { MACRO_CONFIG, NUTRIENT_CONFIG } from "@/lib/nutrients";

type SortDir = "asc" | "desc";

type SortKey =
  | "name"
  | "servingSize"
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "sugar"
  | "sodium";

interface SortableColumn {
  key: SortKey;
  label: string;
}

const SORTABLE_COLUMNS: SortableColumn[] = [
  { key: "name", label: "Food" },
  { key: "servingSize", label: "Serving" },
  { key: "calories", label: MACRO_CONFIG.calories.label },
  { key: "protein", label: MACRO_CONFIG.protein.label },
  { key: "carbs", label: MACRO_CONFIG.carbs.label },
  { key: "fat", label: MACRO_CONFIG.fat.label },
  { key: "sugar", label: NUTRIENT_CONFIG.sugar.label },
  { key: "sodium", label: NUTRIENT_CONFIG.sodium.label },
];

function formatOptionalGrams(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${value.toFixed(1)} g`;
}

function formatOptionalMg(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${Math.round(value)} mg`;
}

function compareNullableNumbers(
  a: number | null,
  b: number | null,
  dir: SortDir,
): number {
  if (a === null && b === null) {
    return 0;
  }
  if (a === null) {
    return 1;
  }
  if (b === null) {
    return -1;
  }
  return dir === "asc" ? a - b : b - a;
}

function compareFoods(a: FoodRecord, b: FoodRecord, key: SortKey, dir: SortDir) {
  switch (key) {
    case "name":
      return dir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    case "servingSize":
      return compareNullableNumbers(a.servingSize, b.servingSize, dir);
    case "calories":
      return compareNullableNumbers(a.calories, b.calories, dir);
    case "protein":
      return compareNullableNumbers(a.protein, b.protein, dir);
    case "carbs":
      return compareNullableNumbers(a.carbs, b.carbs, dir);
    case "fat":
      return compareNullableNumbers(a.fat, b.fat, dir);
    case "sugar":
      return compareNullableNumbers(a.sugar, b.sugar, dir);
    case "sodium":
      return compareNullableNumbers(a.sodium, b.sodium, dir);
    default:
      return 0;
  }
}

interface SortableHeaderProps {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey | null;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}

function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
}: SortableHeaderProps) {
  const isActive = activeSortKey === sortKey;

  return (
    <th className="px-3 py-2 font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-left transition-colors hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
          isActive ? "text-text-primary" : "text-text-secondary"
        }`}
        aria-sort={
          isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <span>{label}</span>
        {isActive ? (
          <span aria-hidden="true" className="text-xs">
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        ) : null}
      </button>
    </th>
  );
}

interface FoodDataTableProps {
  foods: FoodRecord[];
  loading: boolean;
  onEdit: (food: FoodRecord) => void;
  onDelete: (food: FoodRecord) => Promise<void>;
}

export function FoodDataTable({
  foods,
  loading,
  onEdit,
  onDelete,
}: FoodDataTableProps) {
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir("asc");
  }

  const displayFoods = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? foods.filter((food) => food.name.toLowerCase().includes(normalized))
      : [...foods];

    if (!sortKey) {
      return filtered;
    }

    return filtered.sort((a, b) => compareFoods(a, b, sortKey, sortDir));
  }, [foods, query, sortKey, sortDir]);

  async function handleDelete(food: FoodRecord) {
    const confirmed = window.confirm(
      `Delete "${food.name}" from saved food? Past log entries will keep their saved nutrient values.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(food.id);
    try {
      await onDelete(food);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-soft">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-text-primary">
            Saved Food
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {foods.length} saved food{foods.length === 1 ? "" : "s"}
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search foods..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:max-w-xs"
        />
      </div>

      {loading ? (
        <p className="text-sm text-text-secondary">Loading food data...</p>
      ) : displayFoods.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {foods.length === 0
            ? "No saved food yet. Add one to get started."
            : "No foods match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                {SORTABLE_COLUMNS.map((column) => (
                  <SortableHeader
                    key={column.key}
                    label={column.label}
                    sortKey={column.key}
                    activeSortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                ))}
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayFoods.map((food) => (
                <tr
                  key={food.id}
                  className="border-b border-border/70 last:border-b-0"
                >
                  <td className="px-3 py-3 font-medium text-text-primary">
                    {food.name}
                  </td>
                  <td className="px-3 py-3 text-text-secondary">
                    {food.servingSize} {food.servingUnit}
                  </td>
                  <td className="px-3 py-3">{Math.round(food.calories)}</td>
                  <td className="px-3 py-3">{food.protein.toFixed(1)} g</td>
                  <td className="px-3 py-3">{food.carbs.toFixed(1)} g</td>
                  <td className="px-3 py-3">{food.fat.toFixed(1)} g</td>
                  <td className="px-3 py-3">{formatOptionalGrams(food.sugar)}</td>
                  <td className="px-3 py-3">{formatOptionalMg(food.sodium)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(food)}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(food)}
                        disabled={deletingId === food.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === food.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
