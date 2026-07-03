"use client";

import { useEffect, useRef, useState } from "react";

import { MEAL_CONFIG, type MealType } from "@/lib/meals";

const MEAL_TYPES = Object.keys(MEAL_CONFIG) as MealType[];

interface MealTypeDropdownProps {
  value: MealType;
  onChange: (meal: MealType) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function MealTypeDropdown({
  value,
  onChange,
  disabled = false,
  compact = false,
}: MealTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-label="Select meal"
        className={`rounded-xl border border-border bg-surface text-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40 ${
          compact ? "px-2.5 py-1.5" : "px-3 py-2"
        }`}
      >
        <span className="capitalize">{value}</span>
        <svg
          className="ml-1 inline-block h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[130px] overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          {MEAL_TYPES.map((meal) => (
            <button
              key={meal}
              type="button"
              onClick={() => {
                onChange(meal);
                setOpen(false);
              }}
              className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary-subtle ${
                value === meal ? "font-medium text-primary" : "text-text-primary"
              }`}
            >
              <span
                className="mr-2 h-2 w-2 rounded-full"
                style={{ backgroundColor: MEAL_CONFIG[meal].accentColor }}
              />
              {MEAL_CONFIG[meal].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
