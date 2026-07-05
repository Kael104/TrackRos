"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  computeGoalPayload,
  DEFAULT_AGE,
  DEFAULT_GENDER,
  GENDER_OPTIONS,
  type Gender,
  type GoalPayload,
} from "@/lib/standard-goals";
import {
  DEFAULT_DAILY_GOALS,
  MACRO_CONFIG,
  NUTRIENT_CONFIG,
  type ExtendedNutrientKey,
  type MacroKey,
} from "@/lib/nutrients";
import {
  fetchGoals,
  fetchSettingsSchemaStatus,
  saveGoals,
} from "@/app/actions/settings";
import { SCHEMA_SETUP_MESSAGE } from "@/lib/schema-messages";

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary shadow-soft placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const PREVIEW_NUTRIENT_FIELDS: Record<
  ExtendedNutrientKey,
  keyof Pick<
    GoalPayload,
    | "fiber_g"
    | "sugar_g"
    | "sodium_mg"
    | "saturated_fat_g"
    | "cholesterol_mg"
    | "potassium_mg"
    | "calcium_mg"
    | "iron_mg"
  >
> = {
  fiber: "fiber_g",
  sugar: "sugar_g",
  sodium: "sodium_mg",
  saturatedFat: "saturated_fat_g",
  cholesterol: "cholesterol_mg",
  potassium: "potassium_mg",
  calcium: "calcium_mg",
  iron: "iron_mg",
};

function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseAge(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 120) return null;
  return parsed;
}

export function GoalsForm() {
  const [caloriesInput, setCaloriesInput] = useState(
    String(DEFAULT_DAILY_GOALS.calories.goal),
  );
  const [proteinInput, setProteinInput] = useState(
    String(DEFAULT_DAILY_GOALS.protein.goal),
  );
  const [ageInput, setAgeInput] = useState(String(DEFAULT_AGE));
  const [gender, setGender] = useState<Gender>(DEFAULT_GENDER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const schemaStatus = await fetchSettingsSchemaStatus();
      setSetupRequired(schemaStatus === "missing");

      if (schemaStatus === "missing") {
        return;
      }

      const goals = await fetchGoals();
      if (goals) {
        setCaloriesInput(String(goals.calories));
        setProteinInput(String(goals.protein_g));
        setAgeInput(String(goals.age ?? DEFAULT_AGE));
        setGender(goals.gender ?? DEFAULT_GENDER);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  const calories = parsePositiveNumber(caloriesInput);
  const protein = parsePositiveNumber(proteinInput);
  const age = parseAge(ageInput);
  const isValid = calories !== null && protein !== null && age !== null;

  const preview = useMemo(() => {
    if (!isValid || calories === null || protein === null || age === null) {
      return null;
    }
    return computeGoalPayload(calories, protein, age, gender);
  }, [calories, protein, age, gender, isValid]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || calories === null || protein === null || age === null) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await saveGoals(computeGoalPayload(calories, protein, age, gender));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save goals");
    } finally {
      setSaving(false);
    }
  }

  const derivedMacroKeys: MacroKey[] = ["carbs", "fat"];
  const fixedNutrientKeys = Object.keys(
    NUTRIENT_CONFIG,
  ) as ExtendedNutrientKey[];

  return (
    <div className="space-y-8">
      {setupRequired && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Database setup required</p>
          <p className="mt-1">{SCHEMA_SETUP_MESSAGE}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Goals saved. Your dashboard will use the updated targets.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-secondary">Loading your goals…</p>
      ) : (
        <form onSubmit={(e) => void handleSave(e)} className="space-y-8">
          <section className="rounded-xl border border-border bg-surface p-6 shadow-soft">
            <h2 className="font-heading text-lg font-semibold text-text-primary">
              Your daily targets
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Set your calorie, protein, age, and gender. Carbs, fat, and
              micronutrients are standardized automatically from those values.
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="goal-calories"
                  className="block text-sm font-medium text-text-secondary"
                >
                  {MACRO_CONFIG.calories.label}
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="goal-calories"
                    type="number"
                    min={1}
                    step={1}
                    value={caloriesInput}
                    onChange={(e) => {
                      setCaloriesInput(e.target.value);
                      setSuccess(false);
                    }}
                    disabled={setupRequired || saving}
                    className={INPUT_CLASS}
                  />
                  <span className="shrink-0 text-sm text-text-muted">
                    {MACRO_CONFIG.calories.unit}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="goal-protein"
                  className="block text-sm font-medium text-text-secondary"
                >
                  {MACRO_CONFIG.protein.label}
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="goal-protein"
                    type="number"
                    min={1}
                    step={1}
                    value={proteinInput}
                    onChange={(e) => {
                      setProteinInput(e.target.value);
                      setSuccess(false);
                    }}
                    disabled={setupRequired || saving}
                    className={INPUT_CLASS}
                  />
                  <span className="shrink-0 text-sm text-text-muted">
                    {MACRO_CONFIG.protein.unit}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="goal-age"
                  className="block text-sm font-medium text-text-secondary"
                >
                  Age
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="goal-age"
                    type="number"
                    min={1}
                    max={120}
                    step={1}
                    value={ageInput}
                    onChange={(e) => {
                      setAgeInput(e.target.value);
                      setSuccess(false);
                    }}
                    disabled={setupRequired || saving}
                    className={INPUT_CLASS}
                  />
                  <span className="shrink-0 text-sm text-text-muted">years</span>
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-text-secondary">
                  Gender
                </span>
                <div
                  className="mt-2 flex rounded-xl border border-border bg-surface p-1 shadow-soft"
                  role="radiogroup"
                  aria-label="Gender"
                >
                  {GENDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={gender === option.value}
                      onClick={() => {
                        setGender(option.value);
                        setSuccess(false);
                      }}
                      disabled={setupRequired || saving}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                        gender === option.value
                          ? "bg-primary text-white shadow-soft"
                          : "text-text-secondary hover:bg-neutral-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!isValid && (
              <p className="mt-4 text-sm text-amber-700">
                Enter positive numbers for calories and protein, and an age
                between 1 and 120.
              </p>
            )}

            <button
              type="submit"
              disabled={!isValid || setupRequired || saving}
              className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save goals"}
            </button>
          </section>

          {preview && age !== null && (
            <section className="rounded-xl border border-border bg-surface p-6 shadow-soft">
              <h2 className="font-heading text-lg font-semibold text-text-primary">
                Standardized for a {age}-year-old{" "}
                {GENDER_OPTIONS.find((option) => option.value === gender)?.label.toLowerCase()}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                These values update automatically from your calorie, protein,
                age, and gender targets, or use fixed reference amounts.
              </p>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-text-secondary">
                  Derived macros
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2">
                  {derivedMacroKeys.map((key) => {
                    const config = MACRO_CONFIG[key];
                    const value =
                      key === "carbs" ? preview.carbs_g : preview.fat_g;
                    return (
                      <div
                        key={key}
                        className="rounded-lg border border-border bg-surface px-4 py-3 shadow-soft"
                      >
                        <dt className="text-xs text-text-muted">
                          {config.label}
                        </dt>
                        <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-text-primary">
                          {value} {config.unit}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-text-secondary">
                  Fixed micronutrients
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {fixedNutrientKeys.map((key) => {
                    const config = NUTRIENT_CONFIG[key];
                    const value = preview[PREVIEW_NUTRIENT_FIELDS[key]];
                    return (
                      <div
                        key={key}
                        className="rounded-lg border border-border bg-surface px-4 py-3 shadow-soft"
                      >
                        <dt className="text-xs text-text-muted">
                          {config.label}
                        </dt>
                        <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-text-primary">
                          {value} {config.unit}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </section>
          )}
        </form>
      )}
    </div>
  );
}
