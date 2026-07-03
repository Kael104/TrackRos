export interface ParsedFoodInput {
  quantity: number;
  unit: string | null;
  foodName: string;
}

const KNOWN_UNITS = new Set([
  "pc",
  "pcs",
  "piece",
  "pieces",
  "cup",
  "cups",
  "g",
  "gram",
  "grams",
  "ml",
  "oz",
  "tbsp",
  "tsp",
  "slice",
  "slices",
  "bowl",
  "bowls",
  "serving",
  "servings",
]);

/**
 * Parses free-text food input like "3 pc fried chicken" into quantity, unit, and food name.
 */
export function parseFoodInput(raw: string): ParsedFoodInput {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { quantity: 1, unit: null, foodName: "" };
  }

  const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (!numMatch) {
    return { quantity: 1, unit: null, foodName: trimmed };
  }

  const quantity = parseFloat(numMatch[1]);
  const rest = numMatch[2].trim();
  const parts = rest.split(/\s+/);
  const firstWord = parts[0]?.toLowerCase();

  if (firstWord && KNOWN_UNITS.has(firstWord)) {
    const foodName = parts.slice(1).join(" ").trim();
    return {
      quantity,
      unit: firstWord,
      foodName: foodName || rest,
    };
  }

  return { quantity, unit: null, foodName: rest };
}
