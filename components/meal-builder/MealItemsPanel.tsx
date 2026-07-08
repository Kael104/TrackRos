"use client";

import { useEffect, useMemo, useState } from "react";

import { foodRecordToNutrients } from "@/lib/food-mapper";
import type { BuiltMealItemInput } from "@/lib/presets-types";
import { scaleNutrients, type ScaledNutrients } from "@/lib/scale-nutrients";

export interface BuilderItem extends BuiltMealItemInput {
  key: string;
  price: number | null;
}

export function sumScaledNutrients(items: BuilderItem[]): ScaledNutrients {
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

interface MealItemsPanelProps {
  items: BuilderItem[];
  onUpdateQuantity: (index: number, quantity: string) => void;
  onRemove: (index: number) => void;
}

interface QuantityInputProps {
  quantity: number;
  onChange: (value: string) => void;
}

function QuantityInput({ quantity, onChange }: QuantityInputProps) {
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  function handleChange(value: string) {
    setDraft(value);

    const parsed = parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      onChange(value);
    }
  }

  function handleBlur() {
    const parsed = parseFloat(draft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDraft(String(quantity));
    }
  }

  return (
    <input
      type="number"
      min="0.25"
      step="1"
      value={draft}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      className="w-16 rounded-lg border border-border px-2 py-1 text-sm"
    />
  );
}

export function MealItemsPanel({
  items,
  onUpdateQuantity,
  onRemove,
}: MealItemsPanelProps) {
  const totals = useMemo(() => sumScaledNutrients(items), [items]);
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + (item.price ?? 0), 0),
    [items],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <ul className="mt-4 space-y-2">
        {items.map((item, index) => (
          <li
            key={item.key}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-neutral-50/80 px-3 py-2 text-sm"
          >
            <span className="flex-1 capitalize">{item.food.name}</span>
            <QuantityInput
              quantity={item.quantity}
              onChange={(value) => onUpdateQuantity(index, value)}
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
              onClick={() => onRemove(index)}
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
  );
}
