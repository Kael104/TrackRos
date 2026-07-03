import {
  describeArc,
  describeProgressArc,
} from "@/lib/arc-path";
import {
  MACRO_CONFIG,
  NUTRIENT_CONFIG,
  getGoalMicroAverageProgress,
  getMacroProgress,
  isNutrientOverLimit,
  type DailyMacros,
  type DailyNutrients,
} from "@/lib/nutrients";

interface DayRingProps {
  macros: DailyMacros;
  nutrients: DailyNutrients;
  size?: number;
  hasData?: boolean;
}

const MACRO_SEGMENTS = [
  { key: "protein" as const, start: -90, end: 30 },
  { key: "carbs" as const, start: 30, end: 150 },
  { key: "fat" as const, start: 150, end: 270 },
];

function RingArc({
  center,
  radius,
  startAngle,
  endAngle,
  progress,
  color,
  trackColor,
  strokeWidth,
  strokeLinecap = "round",
}: {
  center: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  progress: number;
  color: string;
  trackColor: string;
  strokeWidth: number;
  strokeLinecap?: "round" | "butt";
}) {
  const trackPath = describeArc(center, radius, startAngle, endAngle);
  const progressPath = describeProgressArc(
    center,
    radius,
    startAngle,
    endAngle,
    progress,
  );

  return (
    <>
      <path
        d={trackPath}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
      />
      {progressPath && (
        <path
          d={progressPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap={strokeLinecap}
        />
      )}
    </>
  );
}

function GlowArc({
  center,
  radius,
  startAngle,
  endAngle,
  color,
  active,
  strokeWidth,
}: {
  center: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  color: string;
  active: boolean;
  strokeWidth: number;
}) {
  if (!active) {
    return null;
  }

  const path = describeArc(center, radius, startAngle, endAngle);

  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      style={{
        filter: `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 8px ${color})`,
      }}
    />
  );
}

export function DayRing({
  macros,
  nutrients,
  size = 56,
  hasData = true,
}: DayRingProps) {
  const center = size / 2;
  const opacity = hasData ? 1 : 0.35;

  const glowRadius = center - 2;
  const caloriesRadius = center - 5;
  const macroRadius = center - 10;
  const innerRadius = center - 16;

  const caloriesProgress = getMacroProgress(
    macros.calories.current,
    macros.calories.goal,
  );
  const microProgress = getGoalMicroAverageProgress(nutrients);

  const sugarOver = isNutrientOverLimit(
    nutrients.sugar.current,
    nutrients.sugar.goal,
    NUTRIENT_CONFIG.sugar.direction,
  );
  const sodiumOver = isNutrientOverLimit(
    nutrients.sodium.current,
    nutrients.sodium.goal,
    NUTRIENT_CONFIG.sodium.direction,
  );

  const caloriesTrack = describeArc(center, caloriesRadius, -90, 270);
  const caloriesProgressPath = describeProgressArc(
    center,
    caloriesRadius,
    -90,
    270,
    caloriesProgress,
  );

  const innerTrack = describeArc(center, innerRadius, -90, 270);
  const innerProgressPath = describeProgressArc(
    center,
    innerRadius,
    -90,
    270,
    microProgress,
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
      style={{ opacity }}
    >
      <GlowArc
        center={center}
        radius={glowRadius}
        startAngle={270}
        endAngle={90}
        color="var(--color-nutrient-sugar)"
        active={sugarOver}
        strokeWidth={2}
      />
      <GlowArc
        center={center}
        radius={glowRadius}
        startAngle={90}
        endAngle={270}
        color="var(--color-nutrient-sodium)"
        active={sodiumOver}
        strokeWidth={2}
      />

      <path
        d={caloriesTrack}
        fill="none"
        stroke={MACRO_CONFIG.calories.trackColor}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {caloriesProgressPath && (
        <path
          d={caloriesProgressPath}
          fill="none"
          stroke={MACRO_CONFIG.calories.color}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}

      {MACRO_SEGMENTS.map(({ key, start, end }) => {
        const { current, goal } = macros[key];
        const config = MACRO_CONFIG[key];

        return (
          <RingArc
            key={key}
            center={center}
            radius={macroRadius}
            startAngle={start}
            endAngle={end}
            progress={getMacroProgress(current, goal)}
            color={config.color}
            trackColor={config.trackColor}
            strokeWidth={3}
            strokeLinecap="butt"
          />
        );
      })}

      <path
        d={innerTrack}
        fill="none"
        stroke="var(--color-nutrient-potassium-track)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {innerProgressPath && (
        <path
          d={innerProgressPath}
          fill="none"
          stroke="var(--color-nutrient-potassium)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
