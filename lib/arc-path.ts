export function polarToCartesian(
  center: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(angleRad),
    y: center + radius * Math.sin(angleRad),
  };
}

export function describeArc(
  center: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(center, radius, startAngle);
  const end = polarToCartesian(center, radius, endAngle);
  const sweep = endAngle - startAngle;
  const largeArcFlag = sweep > 180 ? 1 : 0;

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    1,
    end.x,
    end.y,
  ].join(" ");
}

export function describeProgressArc(
  center: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  progress: number,
): string | null {
  if (progress <= 0) {
    return null;
  }

  const clampedProgress = Math.min(progress, 1);
  const effectiveEnd =
    startAngle + (endAngle - startAngle) * clampedProgress;

  if (effectiveEnd <= startAngle) {
    return null;
  }

  return describeArc(center, radius, startAngle, effectiveEnd);
}
