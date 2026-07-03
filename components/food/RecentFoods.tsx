"use client";

import { useState } from "react";

import { MealTypeDropdown } from "@/components/food/MealTypeDropdown";
import { FREQUENT_FOOD_THRESHOLD } from "@/lib/presets-types";
import type { RecentFoodItem } from "@/lib/presets-types";
import type { MealType } from "@/lib/meals";
import {
  defaultRecentUnit,
  getRecentUnitOptions,
  isWeightUnit,
  normalizeUnitLabel,
} from "@/lib/serving-units";
import { useDashboardStore } from "@/store/useDashboardStore";

interface RecentFoodsProps {
  items: RecentFoodItem[];
  loading?: boolean;
}

interface RecentRowState {
  quantity: string;
  unit: string;
  mealType: MealType;
  adding: boolean;
  added: boolean;
  removing: boolean;
}

function defaultRowState(item: RecentFoodItem): RecentRowState {
  return {
    quantity: String(item.lastServings),
    unit: defaultRecentUnit(item.food.servingUnit, item.lastServingLabel),
    mealType: "breakfast",
    adding: false,
    added: false,
    removing: false,
  };
}

export function RecentFoods({ items, loading = false }: RecentFoodsProps) {
  const quickAddFood = useDashboardStore((s) => s.quickAddFood);
  const removeCachedFood = useDashboardStore((s) => s.removeCachedFood);

  const [rowState, setRowState] = useState<Record<number, RecentRowState>>({});

  function getRowState(item: RecentFoodItem): RecentRowState {
    const base = rowState[item.food.id] ?? defaultRowState(item);
    return {
      ...base,
      unit: normalizeUnitLabel(base.unit),
    };
  }

  function updateRow(item: RecentFoodItem, patch: Partial<RecentRowState>) {
    setRowState((prev) => ({
      ...prev,
      [item.food.id]: { ...(prev[item.food.id] ?? defaultRowState(item)), ...patch },
    }));
  }

  async function handleAdd(item: RecentFoodItem) {
    const state = getRowState(item);
    const quantity = parseFloat(state.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    updateRow(item, { adding: true, added: false });

    try {
      await quickAddFood(item.food, quantity, state.unit, state.mealType);
      updateRow(item, { adding: false, added: true });
      setTimeout(() => {
        updateRow(item, { added: false });
      }, 2000);
    } catch {
      updateRow(item, { adding: false });
    }
  }

  async function handleRemove(item: RecentFoodItem) {
    updateRow(item, { removing: true });

    try {
      await removeCachedFood(item.food.id);
      setRowState((prev) => {
        const next = { ...prev };
        delete next[item.food.id];
        return next;
      });
    } catch {
      updateRow(item, { removing: false });
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
        <p className="text-sm text-text-secondary">Loading recent foods…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
        <p className="text-sm text-text-muted">
          Foods you add will appear here for quick re-add.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
      <ul className="space-y-2">
        {items.map((item) => {
          const state = getRowState(item);
          const isFrequent = item.useCount >= FREQUENT_FOOD_THRESHOLD;
          const unitOptions = getRecentUnitOptions();
          const quantityStep = isWeightUnit(state.unit) ? 1 : 0.25;
          const quantityMin = isWeightUnit(state.unit) ? 1 : 0.25;

          return (
            <li
              key={item.food.id}
              className="flex flex-col gap-3 rounded-lg border border-border/60 bg-neutral-50/80 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-text-primary">
                    {item.food.name}
                  </span>
                  {isFrequent && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                      Frequent
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  Last: {item.lastServings} {item.lastServingLabel}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <label className="sr-only" htmlFor={`qty-${item.food.id}`}>
                  Quantity for {item.food.name}
                </label>
                <input
                  id={`qty-${item.food.id}`}
                  type="number"
                  min={quantityMin}
                  step={quantityStep}
                  value={state.quantity}
                  onChange={(e) =>
                    updateRow(item, { quantity: e.target.value })
                  }
                  className="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                <label className="sr-only" htmlFor={`unit-${item.food.id}`}>
                  Unit for {item.food.name}
                </label>
                <select
                  id={`unit-${item.food.id}`}
                  value={state.unit}
                  onChange={(e) => updateRow(item, { unit: e.target.value })}
                  className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>

                <MealTypeDropdown
                  value={state.mealType}
                  onChange={(meal) => updateRow(item, { mealType: meal })}
                  compact
                />

                <button
                  type="button"
                  onClick={() => void handleAdd(item)}
                  disabled={state.adding || state.removing}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                    state.added
                      ? "bg-green-50 text-green-700"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                >
                  {state.adding ? "Adding…" : state.added ? "Added ✓" : "Add"}
                </button>

                <button
                  type="button"
                  onClick={() => void handleRemove(item)}
                  disabled={state.removing || state.adding}
                  aria-label={`Remove ${item.food.name} from recents`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-lg leading-none text-text-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state.removing ? "…" : "×"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
