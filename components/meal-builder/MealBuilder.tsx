"use client";

import { useState } from "react";

import { MealTypeDropdown } from "@/components/food/MealTypeDropdown";
import {
  FoodSearchAdd,
  type FoodSearchAddItem,
} from "@/components/meal-builder/FoodSearchAdd";
import {
  MealItemsPanel,
  type BuilderItem,
} from "@/components/meal-builder/MealItemsPanel";
import type { MealType } from "@/lib/meals";
import type { MealPreset } from "@/lib/presets-types";
import { useDashboardStore } from "@/store/useDashboardStore";

interface MealBuilderProps {
  presets: MealPreset[];
  loading?: boolean;
}

const DEFAULT_MEAL_TYPE: MealType = "breakfast";

function presetToBuilderItems(preset: MealPreset): BuilderItem[] {
  return preset.items.map((item, index) => ({
    key: `${item.food.id}-${index}`,
    food: item.food,
    quantity: item.servings,
    unit: item.servingLabel,
    price: null,
  }));
}

function appendBuilderItem(
  prev: BuilderItem[],
  added: FoodSearchAddItem,
): BuilderItem[] {
  return [
    ...prev,
    {
      key: `${added.food.name}-${Date.now()}-${prev.length}`,
      food: added.food,
      quantity: added.quantity,
      unit: added.unit,
      price: added.price,
    },
  ];
}

function updateItemQuantity(
  items: BuilderItem[],
  index: number,
  quantity: string,
): BuilderItem[] {
  const parsed = parseFloat(quantity);
  if (!Number.isFinite(parsed) || parsed <= 0) return items;

  return items.map((item, i) =>
    i === index ? { ...item, quantity: parsed } : item,
  );
}

export function MealBuilder({ presets, loading = false }: MealBuilderProps) {
  const { saveBuiltMeal, updateBuiltMeal, deletePreset, addPreset } =
    useDashboardStore();

  const [items, setItems] = useState<BuilderItem[]>([]);
  const [mealName, setMealName] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editItems, setEditItems] = useState<BuilderItem[]>([]);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [presetMeals, setPresetMeals] = useState<Record<number, MealType>>({});
  const [addingPresetId, setAddingPresetId] = useState<number | null>(null);
  const [addedPresetId, setAddedPresetId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  function startEdit(preset: MealPreset) {
    setEditingId(preset.id);
    setEditName(preset.name);
    setEditItems(presetToBuilderItems(preset));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditItems([]);
  }

  async function handleSaveEdit(presetId: number) {
    if (!editName.trim() || editItems.length === 0) return;

    setSavingEdit(true);
    try {
      await updateBuiltMeal(
        presetId,
        editName.trim(),
        editItems.map(({ food, quantity, unit }) => ({ food, quantity, unit })),
      );
      cancelEdit();
    } catch {
      // Error surfaced via store
    } finally {
      setSavingEdit(false);
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
      if (editingId === id) {
        cancelEdit();
      }
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
          <FoodSearchAdd
            priceInputId="build-item-price"
            onAdd={(added) => setItems((prev) => appendBuilderItem(prev, added))}
          />
        </div>

        <MealItemsPanel
          items={items}
          onUpdateQuantity={(index, quantity) =>
            setItems((prev) => updateItemQuantity(prev, index, quantity))
          }
          onRemove={removeItem}
        />

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
          Pick a time and add a saved meal to your day, or edit a meal to change
          its foods.
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
              if (editingId === preset.id) {
                return (
                  <li
                    key={preset.id}
                    className="rounded-lg border border-primary/30 bg-primary-subtle/20 px-3 py-4"
                  >
                    <div className="min-w-[140px]">
                      <label
                        className="text-xs text-text-muted"
                        htmlFor={`edit-meal-name-${preset.id}`}
                      >
                        Meal name
                      </label>
                      <input
                        id={`edit-meal-name-${preset.id}`}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="mt-4">
                      <FoodSearchAdd
                        priceInputId={`edit-item-price-${preset.id}`}
                        onAdd={(added) =>
                          setEditItems((prev) => appendBuilderItem(prev, added))
                        }
                      />
                    </div>

                    <MealItemsPanel
                      items={editItems}
                      onUpdateQuantity={(index, quantity) =>
                        setEditItems((prev) =>
                          updateItemQuantity(prev, index, quantity),
                        )
                      }
                      onRemove={(index) =>
                        setEditItems((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveEdit(preset.id)}
                        disabled={
                          savingEdit ||
                          !editName.trim() ||
                          editItems.length === 0
                        }
                        className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {savingEdit ? "Saving…" : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={savingEdit}
                        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </li>
                );
              }

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
                        onClick={() => startEdit(preset)}
                        disabled={editingId != null}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Edit
                      </button>
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
