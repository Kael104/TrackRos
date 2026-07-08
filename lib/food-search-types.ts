export interface ScaledNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  saturatedFat: number | null;
  transFat: number | null;
  cholesterol: number | null;
  potassium: number | null;
  calcium: number | null;
  iron: number | null;
}

export interface FoodRecord {
  id: number;
  name: string;
  servingSize: number;
  servingUnit: string;
  /** Typical pieces in one serving order; used for piece/serving toggle. */
  piecesPerServing?: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  saturatedFat: number | null;
  transFat: number | null;
  cholesterol: number | null;
  potassium: number | null;
  calcium: number | null;
  iron: number | null;
  source: string;
  createdAt: string;
}

export interface FoodSearchResponse {
  food: FoodRecord;
  scaledNutrients: ScaledNutrients;
  quantity: number;
  unit: string | null;
  /** Human-readable portion label stored on the log entry (e.g. "medium banana"). */
  servingLabel: string;
  countMode: "piece" | "serving" | null;
  piecesPerServing: number;
  supportsCountModeChoice: boolean;
  cached: boolean;
}

export interface FoodSearchError {
  error: string;
}
