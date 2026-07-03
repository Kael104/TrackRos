import { NutrientCardGrid } from "@/components/dashboard/NutrientCard";
import {
  NUTRIENT_CONFIG,
  type DailyNutrients,
  type ExtendedNutrientKey,
  isNutrientOverLimit,
} from "@/lib/nutrients";

interface NutrientSummaryProps {
  nutrients: DailyNutrients;
}

export function NutrientSummary({ nutrients }: NutrientSummaryProps) {
  const limitCount = (Object.keys(nutrients) as ExtendedNutrientKey[]).filter(
    (key) => {
      const { current, goal } = nutrients[key];
      return isNutrientOverLimit(
        current,
        goal,
        NUTRIENT_CONFIG[key].direction,
      );
    },
  ).length;

  return (
    <section
      id="nutrient-cards"
      className="relative h-full overflow-hidden rounded-xl border border-border bg-surface p-8 shadow-card"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-accent opacity-80"
        aria-hidden="true"
      />

      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-text-primary">
          Nutrient Summary
        </h2>
        <p className="mt-2 text-base text-text-secondary">
          Quick-glance progress for fiber, sodium, and other micronutrients.
        </p>
      </div>

      <div className="mt-8">
        <NutrientCardGrid nutrients={nutrients} />
      </div>

      {limitCount > 0 && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {limitCount} nutrient{limitCount === 1 ? "" : "s"} over daily limit.
        </p>
      )}
    </section>
  );
}
