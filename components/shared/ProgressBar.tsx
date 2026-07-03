import { getMacroProgress } from "@/lib/nutrients";

export interface ProgressBarProps {
  value: number;
  goal: number;
  color: string;
  trackColor?: string;
  label: string;
  ariaLabel?: string;
}

export function ProgressBar({
  value,
  goal,
  color,
  trackColor = "var(--color-neutral-100)",
  label,
  ariaLabel,
}: ProgressBarProps) {
  const progress = getMacroProgress(value, goal);
  const percent = Math.round(progress * 100);

  return (
    <div className="w-full">
      <div
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-label={ariaLabel ?? `${label}: ${Math.round(value)} of ${goal}`}
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: trackColor }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
