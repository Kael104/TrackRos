import { getMacroProgress } from "@/lib/nutrients";

export interface CircularProgressProps {
  value: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  label: string;
  ariaLabel?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  goal,
  size = 120,
  strokeWidth = 10,
  color,
  trackColor = "var(--color-neutral-100)",
  label,
  ariaLabel,
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = getMacroProgress(value, goal);
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="progressbar"
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-label={ariaLabel ?? `${label}: ${Math.round(value)} of ${goal}`}
          className="-rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>

        {children && (
          <div className="absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>

      <span className="font-heading text-sm font-medium text-text-secondary">
        {label}
      </span>
    </div>
  );
}
