import { formatServings, type LogEntry } from "@/lib/meals";

interface LogEntryItemProps {
  entry: LogEntry;
}

export function LogEntryItem({ entry }: LogEntryItemProps) {
  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {entry.foodName}
        </p>
        <p className="text-xs text-text-muted">
          {formatServings(entry.servings, entry.servingLabel)}
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm tabular-nums text-text-secondary">
        {entry.calories} kcal
      </span>
    </li>
  );
}
