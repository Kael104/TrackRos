import { ProgressBar } from "@/components/shared/ProgressBar";
import {
  NUTRIENT_CONFIG,
  type ExtendedNutrientKey,
  type NutrientConfig,
  type NutrientValue,
  formatNutrientValue,
  getNutrientPercent,
  isNutrientOverLimit,
} from "@/lib/nutrients";

interface NutrientCardProps {
  config: NutrientConfig;
  nutrient: NutrientValue;
}

export function NutrientCard({ config, nutrient }: NutrientCardProps) {
  const { current, goal } = nutrient;
  const percent = getNutrientPercent(current, goal);
  const overLimit = isNutrientOverLimit(current, goal, config.direction);
  const barColor = overLimit
    ? "var(--color-nutrient-over-limit)"
    : config.color;

  return (
    <article className="rounded-lg border border-border-subtle bg-neutral-50/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm font-medium text-text-secondary">
          {config.label}
        </h3>
        {overLimit && (
          <span className="shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
            Over
          </span>
        )}
      </div>

      <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-text-primary">
        {formatNutrientValue(config.key, current)}
        <span className="ml-1 text-sm font-normal text-text-muted">
          / {formatNutrientValue(config.key, goal)} {config.unit}
        </span>
      </p>

      <div className="mt-3">
        <ProgressBar
          value={current}
          goal={goal}
          color={barColor}
          trackColor={config.trackColor}
          label={config.label}
        />
      </div>

      <p
        className="mt-2 font-mono text-xs tabular-nums"
        style={{ color: overLimit ? "var(--color-nutrient-over-limit)" : config.color }}
      >
        {percent}%
        {config.direction === "limit" ? " of limit" : " of goal"}
      </p>
    </article>
  );
}

interface NutrientCardGridProps {
  nutrients: Record<ExtendedNutrientKey, NutrientValue>;
}

export function NutrientCardGrid({ nutrients }: NutrientCardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(Object.keys(NUTRIENT_CONFIG) as ExtendedNutrientKey[]).map((key) => (
        <NutrientCard
          key={key}
          config={NUTRIENT_CONFIG[key]}
          nutrient={nutrients[key]}
        />
      ))}
    </div>
  );
}
