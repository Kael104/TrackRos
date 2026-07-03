import { DayRing } from "@/components/history/DayRing";
import { countMealEntries } from "@/lib/meals";
import type { DayData } from "@/lib/supabase-queries";

interface DayCellProps {
  dayOfMonth: number;
  iso: string;
  isCurrentMonth: boolean;
  isFuture: boolean;
  isToday: boolean;
  isSelected: boolean;
  dayData?: DayData;
  onSelect: (iso: string) => void;
}

export function DayCell({
  dayOfMonth,
  iso,
  isCurrentMonth,
  isFuture,
  isToday,
  isSelected,
  dayData,
  onSelect,
}: DayCellProps) {
  const hasData =
    !!dayData && countMealEntries(dayData.meals) > 0;
  const isInteractive = isCurrentMonth && !isFuture;

  const content = (
    <>
      <span
        className={`font-mono text-xs font-medium tabular-nums ${
          isToday
            ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
            : isCurrentMonth
              ? "text-text-secondary"
              : "text-text-muted"
        }`}
      >
        {dayOfMonth}
      </span>

      {dayData ? (
        <DayRing
          macros={dayData.macros}
          nutrients={dayData.nutrients}
          hasData={hasData}
        />
      ) : (
        <div className="h-14 w-14 rounded-full bg-neutral-100/80" aria-hidden />
      )}
    </>
  );

  if (!isInteractive) {
    return (
      <div
        className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 ${
          isCurrentMonth ? "" : "opacity-40"
        }`}
        aria-hidden={!isCurrentMonth}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(iso)}
      aria-label={`View nutrition for day ${dayOfMonth}`}
      aria-pressed={isSelected}
      className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors ${
        isSelected
          ? "bg-primary-subtle ring-2 ring-primary/30"
          : "hover:bg-neutral-100"
      } ${isFuture ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {content}
    </button>
  );
}
