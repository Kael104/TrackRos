import { ProgressBar } from "@/components/shared/ProgressBar";
import {
  MACRO_CONFIG,
  type DailyMacros,
  type MacroKey,
  formatMacroValue,
  getMacroPercent,
  getRemaining,
} from "@/lib/nutrients";

interface RemainingCaloriesProps {
  macros: DailyMacros;
}

function MacroRemainingRow({
  macroKey,
  current,
  goal,
}: {
  macroKey: Exclude<MacroKey, "calories">;
  current: number;
  goal: number;
}) {
  const config = MACRO_CONFIG[macroKey];
  const remaining = getRemaining(current, goal);
  const percent = getMacroPercent(current, goal);

  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-text-secondary">
          {config.label}
        </span>
        <span
          className="font-mono text-xs font-medium tabular-nums"
          style={{ color: config.color }}
        >
          {percent}%
        </span>
      </div>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-text-primary">
        {formatMacroValue(macroKey, remaining)}
        <span className="ml-1 text-sm font-normal text-text-muted">
          {config.unit} left
        </span>
      </p>
    </div>
  );
}

export function RemainingCalories({ macros }: RemainingCaloriesProps) {
  const { current, goal } = macros.calories;
  const remaining = getRemaining(current, goal);
  const over = Math.max(current - goal, 0);
  const isOverGoal = over > 0;
  const percent = getMacroPercent(current, goal);

  const statusMessage = isOverGoal
    ? `You are ${over.toLocaleString()} kcal over your daily goal.`
    : remaining <= 200
      ? "Almost at your limit — plan the rest of your day carefully."
      : remaining <= 500
        ? "Getting close to your goal. Choose lighter options for later meals."
        : "You have room for more meals today.";

  return (
    <section
      id="remaining-calories"
      className="relative h-full overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-card sm:p-8"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-accent opacity-80"
        aria-hidden="true"
      />

      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-text-primary">
          Remaining Calories
        </h2>
        <p className="mt-2 text-base text-text-secondary">
          Calories and macros left for the rest of your day.
        </p>
      </div>

      <div className="mt-8 text-center">
        {isOverGoal ? (
          <>
            <p className="font-mono text-4xl font-bold tabular-nums text-red-600 sm:text-5xl">
              +{over.toLocaleString()}
            </p>
            <p className="mt-1 text-sm font-medium text-red-600">kcal over goal</p>
          </>
        ) : (
          <>
            <p
              className="font-mono text-4xl font-bold tabular-nums sm:text-5xl"
              style={{ color: "var(--color-macro-calories)" }}
            >
              {remaining.toLocaleString()}
            </p>
            <p className="mt-1 text-sm font-medium text-text-secondary">
              kcal remaining
            </p>
          </>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4 shadow-soft">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-text-secondary">
            <span className="font-mono font-semibold tabular-nums text-text-primary">
              {formatMacroValue("calories", current)}
            </span>{" "}
            eaten
          </span>
          <span className="text-text-muted">
            of{" "}
            <span className="font-mono tabular-nums">
              {formatMacroValue("calories", goal)}
            </span>{" "}
            kcal goal
          </span>
        </div>
        <ProgressBar
          value={current}
          goal={goal}
          color={
            isOverGoal
              ? "var(--color-nutrient-over-limit)"
              : "var(--color-macro-calories)"
          }
          trackColor="var(--color-macro-calories-track)"
          label="Calories"
        />
        <p className="mt-2 text-center font-mono text-xs tabular-nums text-text-muted">
          {percent}% of daily calorie goal
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <MacroRemainingRow
          macroKey="protein"
          current={macros.protein.current}
          goal={macros.protein.goal}
        />
        <MacroRemainingRow
          macroKey="carbs"
          current={macros.carbs.current}
          goal={macros.carbs.goal}
        />
        <MacroRemainingRow
          macroKey="fat"
          current={macros.fat.current}
          goal={macros.fat.goal}
        />
      </div>

      <p
        className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
          isOverGoal
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-border bg-surface text-text-secondary"
        }`}
      >
        {statusMessage}
      </p>
    </section>
  );
}
