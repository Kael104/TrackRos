"use client";

import { useEffect } from "react";

import { HistoryCalendar } from "@/components/history/HistoryCalendar";
import { HistoryDayDetail } from "@/components/history/HistoryDayDetail";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { SCHEMA_SETUP_MESSAGE } from "@/lib/supabase-schema";
import { useHistoryStore } from "@/store/useHistoryStore";

export default function HistoryPage() {
  const {
    currentMonth,
    daysData,
    selectedDate,
    loading,
    error,
    setupRequired,
    loadMonth,
    goToPreviousMonth,
    goToNextMonth,
    selectDay,
    clearSelection,
  } = useHistoryStore();

  useEffect(() => {
    const { year, month } = currentMonth;
    void loadMonth(year, month);
    // Only load on initial mount; month navigation calls loadMonth directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMonth]);

  return (
    <PageContainer>
      <PageHeader
        title="History"
        description="Browse past days and review your nutrition trends."
      />

      {setupRequired && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Database setup required</p>
          <p className="mt-1">{SCHEMA_SETUP_MESSAGE}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <HistoryCalendar
        currentMonth={currentMonth}
        daysData={daysData}
        selectedDate={selectedDate}
        loading={loading}
        onPreviousMonth={() => void goToPreviousMonth()}
        onNextMonth={() => void goToNextMonth()}
        onSelectDay={selectDay}
      />

      {loading && (
        <p className="text-sm text-text-secondary">Loading calendar…</p>
      )}

      {selectedDate && (
        <HistoryDayDetail
          selectedDate={selectedDate}
          onClose={clearSelection}
        />
      )}
    </PageContainer>
  );
}
