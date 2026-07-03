const WEIGHT_UNITS = new Set(["g", "gram", "grams", "mg", "milligram", "milligrams"]);

const COUNT_UNIT = "piece";

const COUNT_ALIASES = new Set([
  "pc",
  "pcs",
  "piece",
  "pieces",
  "serving",
  "servings",
]);

export function isWeightUnit(unit: string): boolean {
  return WEIGHT_UNITS.has(unit.toLowerCase().trim());
}

export function isCountUnit(unit: string): boolean {
  return COUNT_ALIASES.has(unit.toLowerCase().trim());
}

export function normalizeUnitLabel(unit: string): string {
  const lower = unit.toLowerCase().trim();
  if (lower === "grams") return "g";
  if (COUNT_ALIASES.has(lower)) return COUNT_UNIT;
  return lower;
}

/** Unit options shown when re-adding from recents. */
export function getRecentUnitOptions(): string[] {
  return [COUNT_UNIT, "g"];
}

/** Prefer piece for quick re-add unless the last log was explicitly in grams. */
export function defaultRecentUnit(_servingUnit: string, lastLabel: string): string {
  const normalizedLast = normalizeUnitLabel(lastLabel);
  if (isWeightUnit(normalizedLast)) {
    return "g";
  }
  return COUNT_UNIT;
}

export interface ResolvedAddParams {
  quantity: number;
  unit: string;
  servingLabel: string;
}

function resolveMediumServingLabel(foodServingUnit: string): string {
  const normalized = foodServingUnit.trim();
  if (!normalized || isWeightUnit(normalized)) {
    return "medium";
  }
  return normalized;
}

/**
 * Default add = one standard medium portion unless the user explicitly typed a weight unit (g).
 */
export function resolveAddParams(
  parsedQuantity: number,
  parsedUnit: string | null,
  foodServingUnit: string,
): ResolvedAddParams {
  if (parsedUnit && isWeightUnit(parsedUnit)) {
    return {
      quantity: parsedQuantity,
      unit: normalizeUnitLabel(parsedUnit),
      servingLabel: normalizeUnitLabel(parsedUnit),
    };
  }

  if (
    parsedUnit &&
    !isCountUnit(parsedUnit) &&
    !isWeightUnit(normalizeUnitLabel(parsedUnit))
  ) {
    const unit = normalizeUnitLabel(parsedUnit);
    return {
      quantity: parsedQuantity,
      unit,
      servingLabel: unit,
    };
  }

  return {
    quantity: parsedQuantity,
    unit: COUNT_UNIT,
    servingLabel: resolveMediumServingLabel(foodServingUnit),
  };
}

export function formatAddQuantityLabel(
  quantity: number,
  servingLabel: string,
): string {
  const qty = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
  return `${qty} ${servingLabel}`;
}

export function computeScaleMultiplier(
  servingSize: number,
  servingUnit: string,
  quantity: number,
  unit: string | null | undefined,
): number {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 0;
  }

  const normalizedUnit = unit ? normalizeUnitLabel(unit) : null;

  if (normalizedUnit && isWeightUnit(normalizedUnit)) {
    const baseSize =
      servingSize > 0 ? servingSize : 1;
    return quantity / baseSize;
  }

  return quantity;
}
