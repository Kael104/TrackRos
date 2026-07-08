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

const SERVING_UNIT_INDICATORS = ["serving", "cup", "bowl", "plate"];

export type CountMode = "piece" | "serving";

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
  countMode: CountMode | null;
  piecesPerServing: number;
  supportsCountModeChoice: boolean;
}

export function inferFoodBaseMode(servingUnit: string): CountMode {
  const lower = servingUnit.toLowerCase().trim();
  if (
    lower === "piece" ||
    lower === "pieces" ||
    lower === "pc" ||
    lower === "pcs" ||
    lower === "slice" ||
    lower === "slices"
  ) {
    return "piece";
  }
  if (SERVING_UNIT_INDICATORS.some((word) => lower.includes(word))) {
    return "serving";
  }
  return "piece";
}

export function supportsCountModeChoice(servingUnit: string): boolean {
  return inferFoodBaseMode(servingUnit) === "piece";
}

export function inferPiecesPerServing(
  servingUnit: string,
  explicit?: number | null,
): number {
  if (explicit != null && explicit > 0) {
    return explicit;
  }

  const match = servingUnit.match(
    /(\d+(?:\.\d+)?)\s+(?:pc|pcs|piece|pieces|crackers|strips|nuggets|siomai|dumplings?|rolls?)/i,
  );
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  if (inferFoodBaseMode(servingUnit) === "piece") {
    return 6;
  }

  return 1;
}

export function defaultCountMode(servingUnit: string): CountMode {
  return supportsCountModeChoice(servingUnit) ? "piece" : inferFoodBaseMode(servingUnit);
}

function computeCountModeFactor(
  foodServingUnit: string,
  countMode: CountMode,
  piecesPerServing: number,
): number {
  const baseMode = inferFoodBaseMode(foodServingUnit);
  if (baseMode === countMode) {
    return 1;
  }
  if (baseMode === "piece" && countMode === "serving") {
    return piecesPerServing;
  }
  if (baseMode === "serving" && countMode === "piece") {
    return 1 / piecesPerServing;
  }
  return 1;
}

function resolveMediumServingLabel(
  foodServingUnit: string,
  countMode: CountMode,
): string {
  if (supportsCountModeChoice(foodServingUnit)) {
    return countMode;
  }

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
  countMode?: CountMode,
  piecesPerServing?: number | null,
): ResolvedAddParams {
  const pps = inferPiecesPerServing(foodServingUnit, piecesPerServing);
  const canChoose = supportsCountModeChoice(foodServingUnit);

  if (parsedUnit && isWeightUnit(parsedUnit)) {
    return {
      quantity: parsedQuantity,
      unit: normalizeUnitLabel(parsedUnit),
      servingLabel: normalizeUnitLabel(parsedUnit),
      countMode: null,
      piecesPerServing: pps,
      supportsCountModeChoice: false,
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
      countMode: null,
      piecesPerServing: pps,
      supportsCountModeChoice: false,
    };
  }

  const mode = countMode ?? defaultCountMode(foodServingUnit);

  return {
    quantity: parsedQuantity,
    unit: COUNT_UNIT,
    servingLabel: resolveMediumServingLabel(foodServingUnit, mode),
    countMode: canChoose ? mode : null,
    piecesPerServing: pps,
    supportsCountModeChoice: canChoose,
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
  countMode?: CountMode | null,
  piecesPerServing = 1,
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

  const modeFactor =
    countMode && supportsCountModeChoice(servingUnit)
      ? computeCountModeFactor(servingUnit, countMode, piecesPerServing)
      : 1;

  return quantity * modeFactor;
}
