export function normalizeFoodNameForLookup(name: string): string {
  return name.trim().toLowerCase();
}

/** Sentence-case food name for DB storage (e.g. "banana" -> "Banana"). */
export function formatFoodNameForStorage(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
