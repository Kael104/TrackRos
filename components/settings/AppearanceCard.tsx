"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { THEME_OPTIONS } from "@/lib/theme";

export function AppearanceCard() {
  const { preference, setPreference } = useTheme();

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-8">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-text-primary">
        Appearance
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        Choose light, dark, or match your device setting.
      </p>

      <div className="mt-6">
        <span className="block text-sm font-medium text-text-secondary">
          Color scheme
        </span>
        <div
          className="mt-2 flex rounded-xl border border-border bg-surface p-1 shadow-soft"
          role="radiogroup"
          aria-label="Color scheme"
        >
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={preference === option.value}
              onClick={() => setPreference(option.value)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                preference === option.value
                  ? "bg-primary text-white shadow-soft"
                  : "text-text-secondary hover:bg-neutral-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
