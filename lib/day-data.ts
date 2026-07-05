import type { DailyMacros, DailyNutrients } from "@/lib/nutrients";
import type { DailyMealLog } from "@/lib/meals";

export interface DayData {
  macros: DailyMacros;
  nutrients: DailyNutrients;
  meals: DailyMealLog;
}
