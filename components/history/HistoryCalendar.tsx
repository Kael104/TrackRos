import { DayCell } from "@/components/history/DayCell";
import {
  buildCalendarDays,
  getMonthLabel,
} from "@/lib/format-date";
import type { DayData } from "@/lib/supabase-queries";
import type { MonthRef } from "@/store/useHistoryStore";

interface HistoryCalendarProps {
  currentMonth: MonthRef;
  daysData: Record<string, DayData>;
  selectedDate: string | null;
  loading: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (iso: string) => void;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HistoryCalendar({
  currentMonth,
  daysData,
  selectedDate,
  loading,
  onPreviousMonth,
  onNextMonth,
  onSelectDay,
}: HistoryCalendarProps) {
  const { year, month } = currentMonth;
  const calendarDays = buildCalendarDays(year, month);
  const monthLabel = getMonthLabel(year, month);

  const now = new Date();
  const isCurrentMonthView =
    now.getFullYear() === year && now.getMonth() === month;

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-surface p-3 shadow-card sm:p-8">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-accent opacity-80"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onPreviousMonth}
          disabled={loading}
          aria-label="Previous month"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ←
        </button>

        <div className="text-center">
          <h2 className="font-heading text-xl font-semibold tracking-tight text-text-primary">
            {monthLabel}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Tap a day to view full nutrition details
          </p>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          disabled={loading || isCurrentMonthView}
          aria-label="Next month"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          →
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-0.5 sm:gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 text-center font-heading text-xs font-semibold uppercase tracking-wide text-text-muted"
          >
            {label}
          </div>
        ))}

        {calendarDays.map((day) => (
          <DayCell
            key={day.iso}
            dayOfMonth={day.dayOfMonth}
            iso={day.iso}
            isCurrentMonth={day.isCurrentMonth}
            isFuture={day.isFuture}
            isToday={day.isToday}
            isSelected={selectedDate === day.iso}
            dayData={daysData[day.iso]}
            onSelect={onSelectDay}
          />
        ))}
      </div>

      <RingLegend />
    </section>
  );
}

function RingLegend() {
  return (
    <div className="mt-8 rounded-lg border border-border-subtle bg-neutral-50/60 p-4">
      <p className="font-heading text-sm font-semibold text-text-primary">
        Ring legend
      </p>
      <div className="mt-3 grid gap-2 text-xs text-text-secondary sm:grid-cols-2">
        <LegendItem
          color="var(--color-macro-calories)"
          label="Outer — calories"
        />
        <LegendItem
          color="var(--color-macro-protein)"
          label="Middle — protein / carbs / fat"
        />
        <LegendItem
          color="var(--color-nutrient-potassium)"
          label="Inner — micros average (fiber, K, Ca, Fe)"
        />
        <LegendItem
          color="var(--color-nutrient-sugar)"
          label="Glow top — sugar over limit"
        />
        <LegendItem
          color="var(--color-nutrient-sodium)"
          label="Glow bottom — sodium over limit"
        />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
