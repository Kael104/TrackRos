import type { UserGoalsRow } from "@/types/database.types";

export const DEFAULT_AGE = 25;

export type Gender = "male" | "female";

export const DEFAULT_GENDER: Gender = "male";

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export type StandardNutrients = {
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  saturated_fat_g: number;
  cholesterol_mg: number;
  potassium_mg: number;
  calcium_mg: number;
  iron_mg: number;
};

/** US DRI reference values for an adult, adjusted by age and gender where applicable. */
export function getStandardNutrientsForAge(
  age: number,
  gender: Gender = DEFAULT_GENDER,
): StandardNutrients {
  const fiber_g =
    gender === "female"
      ? age >= 51
        ? 21
        : 25
      : age >= 51
        ? 30
        : 38;

  const iron_mg = gender === "female" ? 18 : 8;
  const potassium_mg = gender === "female" ? 2600 : 3400;

  return {
    fiber_g,
    sugar_g: 50,
    sodium_mg: 2300,
    saturated_fat_g: 20,
    cholesterol_mg: 300,
    potassium_mg,
    calcium_mg: age >= 71 ? 1200 : 1000,
    iron_mg,
  };
}

/** Micronutrient targets for a 25-year-old adult male (fixed, not user-editable). */
export const STANDARD_ADULT_MALE = getStandardNutrientsForAge(
  DEFAULT_AGE,
  DEFAULT_GENDER,
);

/** AMDR midpoints: carbs 55% and fat 30% of non-protein energy (55:30 ratio). */
export const AMDR_CARB_SHARE = 55 / 85;
export const AMDR_FAT_SHARE = 30 / 85;

export type GoalPayload = Pick<
  UserGoalsRow,
  | "age"
  | "gender"
  | "calories"
  | "protein_g"
  | "carbs_g"
  | "fat_g"
  | "fiber_g"
  | "sugar_g"
  | "sodium_mg"
  | "saturated_fat_g"
  | "cholesterol_mg"
  | "potassium_mg"
  | "calcium_mg"
  | "iron_mg"
>;

export interface DerivedMacros {
  carbs_g: number;
  fat_g: number;
}

export function deriveMacrosFromCaloriesAndProtein(
  calories: number,
  protein_g: number,
): DerivedMacros {
  const proteinCals = protein_g * 4;
  const remainingCals = Math.max(calories - proteinCals, 0);

  return {
    carbs_g: Math.round((remainingCals * AMDR_CARB_SHARE) / 4),
    fat_g: Math.round((remainingCals * AMDR_FAT_SHARE) / 9),
  };
}

export function computeGoalPayload(
  calories: number,
  protein_g: number,
  age: number = DEFAULT_AGE,
  gender: Gender = DEFAULT_GENDER,
): GoalPayload {
  const { carbs_g, fat_g } = deriveMacrosFromCaloriesAndProtein(
    calories,
    protein_g,
  );

  return {
    age,
    gender,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    ...getStandardNutrientsForAge(age, gender),
  };
}
