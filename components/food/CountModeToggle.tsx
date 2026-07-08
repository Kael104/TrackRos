"use client";

import type { CountMode } from "@/lib/serving-units";

interface CountModeToggleProps {
  value: CountMode;
  piecesPerServing: number;
  onChange: (mode: CountMode) => void;
}

export function CountModeToggle({
  value,
  piecesPerServing,
  onChange,
}: CountModeToggleProps) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-text-muted">Log by</p>
      <div className="mt-1.5 inline-flex rounded-lg border border-border bg-surface p-0.5">
        {(["piece", "serving"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              value === mode
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-neutral-50"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      {value === "serving" && piecesPerServing > 1 && (
        <p className="mt-1.5 text-xs text-text-muted">
          1 serving ≈ {piecesPerServing} pieces
        </p>
      )}
    </div>
  );
}
