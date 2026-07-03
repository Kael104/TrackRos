import { CircularProgress } from "@/components/shared/CircularProgress";
import {
  type DailyMacros,
  type MacroConfig,
  MACRO_CONFIG,
  formatMacroValue,
  getMacroPercent,
  getRemaining,
} from "@/lib/nutrients";

interface MacroRingProps {
  config: MacroConfig;
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

function MacroRing({
  config,
  current,
  goal,
  size = 120,
  strokeWidth = 10,
}: MacroRingProps) {
  const percent = getMacroPercent(current, goal);

  return (
    <CircularProgress
      value={current}
      goal={goal}
      size={size}
      strokeWidth={strokeWidth}
      color={config.color}
      trackColor={config.trackColor}
      label={config.label}
    >
      <div className="flex flex-col items-center text-center">
        <span className="font-mono text-lg font-semibold tabular-nums text-text-primary sm:text-xl">
          {formatMacroValue(config.key, current)}
        </span>
        <span className="font-mono text-xs tabular-nums text-text-muted">
          / {formatMacroValue(config.key, goal)} {config.unit}
        </span>
        <span
          className="mt-1 font-mono text-xs font-medium tabular-nums"
          style={{ color: config.color }}
        >
          {percent}%
        </span>
      </div>
    </CircularProgress>
  );
}

interface MacroRingChartProps {
  macros: DailyMacros;
  dateLabel?: string;
  dateIso?: string;
}

export function MacroRingChart({ macros, dateLabel, dateIso }: MacroRingChartProps) {
  const remainingCalories = getRemaining(
    macros.calories.current,
    macros.calories.goal,
  );

  return (
    <section
      id="macro-rings"
      className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-card sm:p-8 lg:col-span-2"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-accent opacity-80"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-text-primary">
            Daily Macro Rings
          </h2>
          <p className="mt-2 text-base text-text-secondary">
            Progress toward today&apos;s calorie and macro targets.
          </p>
        </div>
        {dateLabel && (
          <time
            dateTime={dateIso}
            className="mt-1 shrink-0 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-text-secondary"
          >
            {dateLabel}
          </time>
        )}
      </div>

      <div className="mx-auto mt-8 grid max-w-md grid-cols-2 place-items-center gap-4 sm:gap-6">
        {(Object.keys(MACRO_CONFIG) as Array<keyof typeof MACRO_CONFIG>).map(
          (key) => {
            const config = MACRO_CONFIG[key];
            const { current, goal } = macros[key];

            return (
              <MacroRing
                key={key}
                config={config}
                current={current}
                goal={goal}
              />
            );
          },
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-lg bg-neutral-50 px-4 py-3 text-sm">
        <span className="text-text-secondary">
          <span className="font-mono font-semibold tabular-nums text-text-primary">
            {remainingCalories.toLocaleString()}
          </span>{" "}
          kcal remaining
        </span>
        <span className="hidden h-4 w-px bg-neutral-200 sm:block" aria-hidden="true" />
        <span className="text-text-muted">
          {getMacroPercent(macros.calories.current, macros.calories.goal)}% of
          daily calorie goal
        </span>
      </div>
    </section>
  );
}
