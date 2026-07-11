"use client";

import { useEffect, useState } from "react";

import { NutrientFormFields } from "@/components/food-data/NutrientFormFields";
import {
  foodRecordToFormValues,
  formValuesToNutrients,
  type NutrientFormValues,
} from "@/components/food-data/nutrient-form-utils";
import type { FoodRecord } from "@/lib/food-search-types";
import type { FoodNutrients } from "@/lib/gemini";

interface FoodEditFormProps {
  food: FoodRecord;
  onClose: () => void;
  onSave: (foodId: number, nutrients: FoodNutrients) => Promise<void>;
}

export function FoodEditForm({ food, onClose, onSave }: FoodEditFormProps) {
  const [values, setValues] = useState<NutrientFormValues>(
    foodRecordToFormValues(food),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(foodRecordToFormValues(food));
    setError(null);
  }, [food]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const nutrients = formValuesToNutrients(values);
      await onSave(food.id, nutrients);
      onClose();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to save food";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="food-edit-title"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-card">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2
              id="food-edit-title"
              className="font-heading text-xl font-semibold text-text-primary"
            >
              Edit {food.name}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Saving updates this food for future logs. Today&apos;s logged
              entries for this food will also update. Past days stay unchanged.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
          >
            Close
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
          <NutrientFormFields
            values={values}
            onChange={setValues}
            disabled={saving}
          />

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
