export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      daily_logs: {
        Row: {
          id: number;
          log_date: string;
          created_at: string;
        };
        Insert: {
          id?: never;
          log_date: string;
          created_at?: string;
        };
        Update: {
          id?: never;
          log_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      foods: {
        Row: {
          id: number;
          name: string;
          serving_size: number;
          serving_unit: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number | null;
          sugar: number | null;
          sodium: number | null;
          saturated_fat: number | null;
          trans_fat: number | null;
          cholesterol: number | null;
          potassium: number | null;
          calcium: number | null;
          iron: number | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: never;
          name: string;
          serving_size: number;
          serving_unit: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber?: number | null;
          sugar?: number | null;
          sodium?: number | null;
          saturated_fat?: number | null;
          trans_fat?: number | null;
          cholesterol?: number | null;
          potassium?: number | null;
          calcium?: number | null;
          iron?: number | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: never;
          name?: string;
          serving_size?: number;
          serving_unit?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number | null;
          sugar?: number | null;
          sodium?: number | null;
          saturated_fat?: number | null;
          trans_fat?: number | null;
          cholesterol?: number | null;
          potassium?: number | null;
          calcium?: number | null;
          iron?: number | null;
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      log_entries: {
        Row: {
          id: number;
          log_id: number;
          food_id: number | null;
          meal_type: "breakfast" | "lunch" | "dinner" | "snacks";
          servings: number;
          serving_label: string | null;
          display_name: string | null;
          nutrients_snapshot: Json | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          log_id: number;
          food_id?: number | null;
          meal_type: "breakfast" | "lunch" | "dinner" | "snacks";
          servings?: number;
          serving_label?: string | null;
          display_name?: string | null;
          nutrients_snapshot?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          log_id?: number;
          food_id?: number | null;
          meal_type?: "breakfast" | "lunch" | "dinner" | "snacks";
          servings?: number;
          serving_label?: string | null;
          display_name?: string | null;
          nutrients_snapshot?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "log_entries_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "log_entries_log_id_fkey";
            columns: ["log_id"];
            isOneToOne: false;
            referencedRelation: "daily_logs";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_preset_items: {
        Row: {
          id: number;
          preset_id: number;
          food_id: number;
          servings: number;
          serving_label: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          preset_id: number;
          food_id: number;
          servings?: number;
          serving_label?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          preset_id?: number;
          food_id?: number;
          servings?: number;
          serving_label?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_preset_items_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_preset_items_preset_id_fkey";
            columns: ["preset_id"];
            isOneToOne: false;
            referencedRelation: "meal_presets";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_presets: {
        Row: {
          id: number;
          name: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snacks";
          created_at: string;
        };
        Insert: {
          id?: never;
          name: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snacks";
          created_at?: string;
        };
        Update: {
          id?: never;
          name?: string;
          meal_type?: "breakfast" | "lunch" | "dinner" | "snacks";
          created_at?: string;
        };
        Relationships: [];
      };
      user_goals: {
        Row: {
          id: number;
          age: number;
          gender: "male" | "female";
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          fiber_g: number;
          sugar_g: number;
          sodium_mg: number;
          saturated_fat_g: number;
          cholesterol_mg: number;
          potassium_mg: number;
          calcium_mg: number;
          iron_mg: number;
          updated_at: string;
        };
        Insert: {
          id?: never;
          age?: number;
          gender?: "male" | "female";
          calories?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          fiber_g?: number;
          sugar_g?: number;
          sodium_mg?: number;
          saturated_fat_g?: number;
          cholesterol_mg?: number;
          potassium_mg?: number;
          calcium_mg?: number;
          iron_mg?: number;
          updated_at?: string;
        };
        Update: {
          id?: never;
          age?: number;
          gender?: "male" | "female";
          calories?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          fiber_g?: number;
          sugar_g?: number;
          sodium_mg?: number;
          saturated_fat_g?: number;
          cholesterol_mg?: number;
          potassium_mg?: number;
          calcium_mg?: number;
          iron_mg?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type MealType = Tables<"log_entries">["meal_type"];

export type FoodRow = Tables<"foods">;
export type LogEntryRow = Tables<"log_entries">;
export type DailyLogRow = Tables<"daily_logs">;
export type MealPresetRow = Tables<"meal_presets">;
export type MealPresetItemRow = Tables<"meal_preset_items">;
export type UserGoalsRow = Tables<"user_goals">;
