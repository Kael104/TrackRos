import Link from "next/link";

import { MealSection } from "@/components/dashboard/MealSection";
import {
  MEAL_CONFIG,
  countMealEntries,
  sumDailyCalories,
  type DailyMealLog,
  type MealType,
} from "@/lib/meals";

interface TodaysMealsProps {
  meals: DailyMealLog;
  editableNames?: boolean;
}

export function TodaysMeals({ meals, editableNames = false }: TodaysMealsProps) {
  const totalEntries = countMealEntries(meals);
  const totalCalories = sumDailyCalories(meals);

  return (
    <section
      id="meal-preview"
      className="relative overflow-hidden rounded-xl border border-border bg-surface p-8 shadow-card lg:col-span-2"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-accent opacity-80"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-text-primary">
            Today&apos;s Meals
          </h2>
          <p className="mt-2 text-base text-text-secondary">
            Breakfast, lunch, dinner, and snacks at a glance.
          </p>
        </div>
        <Link
          href="/log"
          className="mt-1 shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-subtle"
        >
          View full log
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {(Object.keys(MEAL_CONFIG) as MealType[]).map((type) => (
          <MealSection
            key={type}
            type={type}
            entries={meals[type]}
            editableNames={editableNames}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-lg bg-neutral-50 px-4 py-3 text-sm">
        <span className="text-text-secondary">
          <span className="font-mono font-semibold tabular-nums text-text-primary">
            {totalEntries}
          </span>{" "}
          {totalEntries === 1 ? "entry" : "entries"} logged
        </span>
        <span className="hidden h-4 w-px bg-neutral-200 sm:block" aria-hidden="true" />
        <span className="text-text-secondary">
          <span className="font-mono font-semibold tabular-nums text-text-primary">
            {totalCalories.toLocaleString()}
          </span>{" "}
          kcal from meals
        </span>
      </div>
    </section>
  );
}
