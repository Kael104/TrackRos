"use client";

import { useEffect, useRef, useState } from "react";

import { formatServings, type LogEntry, type MealType } from "@/lib/meals";
import { useDashboardStore } from "@/store/useDashboardStore";

interface LogEntryItemProps {
  entry: LogEntry;
  mealType: MealType;
  editable?: boolean;
  removable?: boolean;
}

export function LogEntryItem({
  entry,
  mealType,
  editable = false,
  removable = false,
}: LogEntryItemProps) {
  const renameLogEntry = useDashboardStore((state) => state.renameLogEntry);
  const removeLogEntry = useDashboardStore((state) => state.removeLogEntry);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.foodName);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(entry.foodName);
  }, [entry.foodName]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function cancelEdit() {
    setDraft(entry.foodName);
    setEditing(false);
  }

  async function commitEdit() {
    const trimmed = draft.trim();

    if (!trimmed || trimmed === entry.foodName) {
      cancelEdit();
      return;
    }

    setSaving(true);

    try {
      await renameLogEntry(entry.id, mealType, trimmed);
      setEditing(false);
    } catch {
      setDraft(entry.foodName);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);

    try {
      await removeLogEntry(entry.id, mealType);
    } catch {
      // Error is surfaced via the store.
    } finally {
      setRemoving(false);
    }
  }

  return (
    <li className="flex items-start gap-3 py-2">
      <div className="min-w-0 flex-1">
        {editable && editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            disabled={saving}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void commitEdit()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void commitEdit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                cancelEdit();
              }
            }}
            aria-label={`Edit name for ${entry.foodName}`}
            className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm font-medium text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
        ) : editable ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="group flex w-full min-w-0 items-center gap-1.5 text-left"
            title="Click to edit food name"
          >
            <span className="truncate text-sm font-medium text-text-primary group-hover:text-primary">
              {entry.foodName}
            </span>
            <span
              aria-hidden="true"
              className="shrink-0 text-xs text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
            >
              Edit
            </span>
          </button>
        ) : (
          <p className="truncate text-sm font-medium text-text-primary">
            {entry.foodName}
          </p>
        )}
        <p className="text-xs text-text-muted">
          {formatServings(entry.servings, entry.servingLabel)}
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm tabular-nums text-text-secondary">
        {entry.calories} kcal
      </span>
      {removable && (
        <button
          type="button"
          onClick={() => void handleRemove()}
          disabled={removing || saving}
          aria-label={`Remove ${entry.foodName}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-lg leading-none text-text-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {removing ? "…" : "×"}
        </button>
      )}
    </li>
  );
}
