"use client";

import {
  NUTRIENT_FIELD_GROUPS,
  type NutrientFormValues,
} from "@/components/food-data/nutrient-form-utils";

interface NutrientFormFieldsProps {
  values: NutrientFormValues;
  onChange: (values: NutrientFormValues) => void;
  disabled?: boolean;
}

export function NutrientFormFields({
  values,
  onChange,
  disabled = false,
}: NutrientFormFieldsProps) {
  function updateField<K extends keyof NutrientFormValues>(
    key: K,
    value: NutrientFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-6">
      {NUTRIENT_FIELD_GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-text-secondary">
            {group.title}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.fields.map((field) => (
              <label key={field.key} className="block text-sm">
                <span className="mb-1 block font-medium text-text-primary">
                  {field.label}
                  {"optional" in field && field.optional ? (
                    <span className="ml-1 font-normal text-text-secondary">
                      (optional)
                    </span>
                  ) : null}
                  {"unit" in field && field.unit ? (
                    <span className="ml-1 font-normal text-text-secondary">
                      ({field.unit})
                    </span>
                  ) : null}
                </span>
                <input
                  type={field.type}
                  value={values[field.key]}
                  onChange={(event) =>
                    updateField(field.key, event.target.value)
                  }
                  disabled={disabled}
                  step={field.type === "number" ? "any" : undefined}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
