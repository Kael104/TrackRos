import { LogEntryItem } from "@/components/log/LogEntryItem";
import {
  MEAL_CONFIG,
  sumMealCalories,
  type LogEntry,
  type MealType,
} from "@/lib/meals";

interface MealSectionProps {
  type: MealType;
  entries: LogEntry[];
}

export function MealSection({ type, entries }: MealSectionProps) {
  const config = MEAL_CONFIG[type];
  const calories = sumMealCalories(entries);
  const isEmpty = entries.length === 0;

  return (
    <article className="flex flex-col rounded-lg border border-border-subtle bg-neutral-50/60">
      <header
        className="flex items-center justify-between gap-2 border-b border-l-[3px] border-border-subtle px-4 py-3"
        style={{ borderLeftColor: config.accentColor }}
      >
        <div>
          <h3 className="font-heading text-sm font-semibold text-text-primary">
            {config.label}
          </h3>
          <p className="text-xs text-text-muted">
            {entries.length} item{entries.length === 1 ? "" : "s"}
          </p>
        </div>
        <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
          {calories} kcal
        </span>
      </header>

      {isEmpty ? (
        <p className="px-4 py-6 text-center text-sm text-text-muted">
          Nothing logged yet
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle px-4">
          {entries.map((entry) => (
            <LogEntryItem key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </article>
  );
}
