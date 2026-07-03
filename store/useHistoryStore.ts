import { create } from "zustand";

import { buildCalendarDays, getMonthBounds } from "@/lib/format-date";
import { getRangeDayData, type DayData } from "@/lib/supabase-queries";
import { getSchemaStatus } from "@/lib/supabase-schema";

export interface MonthRef {
  year: number;
  month: number;
}

interface HistoryStore {
  currentMonth: MonthRef;
  daysData: Record<string, DayData>;
  selectedDate: string | null;
  loading: boolean;
  error: string | null;
  setupRequired: boolean;
  loadMonth: (year: number, month: number) => Promise<void>;
  goToPreviousMonth: () => Promise<void>;
  goToNextMonth: () => Promise<void>;
  selectDay: (iso: string) => void;
  clearSelection: () => void;
}

function getInitialMonth(): MonthRef {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  currentMonth: getInitialMonth(),
  daysData: {},
  selectedDate: null,
  loading: false,
  error: null,
  setupRequired: false,

  loadMonth: async (year, month) => {
    set({
      loading: true,
      error: null,
      currentMonth: { year, month },
      selectedDate: null,
    });

    try {
      const schemaStatus = await getSchemaStatus();
      const calendarDays = buildCalendarDays(year, month);
      const startIso = calendarDays[0]?.iso ?? getMonthBounds(year, month).startIso;
      const endIso =
        calendarDays[calendarDays.length - 1]?.iso ??
        getMonthBounds(year, month).endIso;
      const daysData = await getRangeDayData(startIso, endIso);

      set({
        daysData,
        loading: false,
        setupRequired: schemaStatus === "missing",
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load calendar";
      set({ loading: false, error: message });
    }
  },

  goToPreviousMonth: async () => {
    const { year, month } = get().currentMonth;
    const date = new Date(year, month - 1, 1);
    await get().loadMonth(date.getFullYear(), date.getMonth());
  },

  goToNextMonth: async () => {
    const { year, month } = get().currentMonth;
    const date = new Date(year, month + 1, 1);
    await get().loadMonth(date.getFullYear(), date.getMonth());
  },

  selectDay: (iso) => {
    set({ selectedDate: iso });
  },

  clearSelection: () => {
    set({ selectedDate: null });
  },
}));
