"use client";

import { useState } from "react";

import { NutrientFormFields } from "@/components/food-data/NutrientFormFields";
import {
  DEFAULT_NUTRIENT_FORM_VALUES,
  formValuesToNutrients,
  type NutrientFormValues,
} from "@/components/food-data/nutrient-form-utils";
import type { FoodNutrients } from "@/lib/gemini";

interface AddFoodFormProps {
  onCancel: () => void;
  onSave: (name: string, nutrients: FoodNutrients) => Promise<void>;
}

export function AddFoodForm({ onCancel, onSave }: AddFoodFormProps) {
  const [name, setName] = useState("");
  const [values, setValues] = useState<NutrientFormValues>(
    DEFAULT_NUTRIENT_FORM_VALUES,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Food name is required");
      }

      const nutrients = formValuesToNutrients(values);
      await onSave(trimmedName, nutrients);
      setName("");
      setValues(DEFAULT_NUTRIENT_FORM_VALUES);
      onCancel();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to add food";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-soft">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold text-text-primary">
          Add saved food
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Create a food entry that will be available for future logging and
          search suggestions.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-text-primary">
            Food name
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={saving}
            placeholder="e.g. Chicken breast"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        <NutrientFormFields
          values={values}
          onChange={setValues}
          disabled={saving}
        />

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
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
            {saving ? "Adding..." : "Add food"}
          </button>
        </div>
      </form>
    </section>
  );
}
