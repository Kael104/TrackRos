import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";

export function formatTodayLabels(date: Date = new Date()): {
  label: string;
  iso: string;
} {
  const label = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  const iso = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  return { label, iso };
}

export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getMonthBounds(year: number, month: number): {
  startIso: string;
  endIso: string;
  startDate: Date;
  endDate: Date;
} {
  const startDate = startOfMonth(new Date(year, month, 1));
  const endDate = endOfMonth(startDate);

  return {
    startDate,
    endDate,
    startIso: toIsoDate(startDate),
    endIso: toIsoDate(endDate),
  };
}

export function getMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

export interface CalendarDay {
  date: Date;
  iso: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isFuture: boolean;
  isToday: boolean;
}

export function buildCalendarDays(
  year: number,
  month: number,
  today: Date = new Date(),
): CalendarDay[] {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const todayIso = toIsoDate(today);
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => {
    const iso = toIsoDate(date);
    return {
      date,
      iso,
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isFuture: date > todayStart,
      isToday: iso === todayIso,
    };
  });
}
