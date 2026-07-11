"use client";

import { useEffect, useState } from "react";

import { AddFoodForm } from "@/components/food-data/AddFoodForm";
import { FoodDataTable } from "@/components/food-data/FoodDataTable";
import { FoodEditForm } from "@/components/food-data/FoodEditForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { SCHEMA_SETUP_MESSAGE } from "@/lib/schema-messages";
import type { FoodRecord } from "@/lib/food-search-types";
import { useFoodDataStore } from "@/store/useFoodDataStore";

export default function FoodDataPage() {
  const {
    foods,
    loading,
    error,
    available,
    loadFoods,
    updateFood,
    addFood,
    deleteFood,
  } = useFoodDataStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodRecord | null>(null);

  useEffect(() => {
    void loadFoods();
  }, [loadFoods]);

  return (
    <PageContainer>
      <PageHeader
        title="Food Data"
        description="Review and edit saved food nutrient values. Changes apply to future logs and today's entries only."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!available ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {SCHEMA_SETUP_MESSAGE}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              Edit nutrient data to improve accuracy for future food logging.
            </p>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Add food
              </button>
            )}
          </div>

          {showAddForm && (
            <AddFoodForm
              onCancel={() => setShowAddForm(false)}
              onSave={async (name, nutrients) => {
                await addFood(name, nutrients);
              }}
            />
          )}

          <FoodDataTable
            foods={foods}
            loading={loading}
            onEdit={setEditingFood}
            onDelete={async (food) => {
              await deleteFood(food.id);
            }}
          />
        </div>
      )}

      {editingFood && (
        <FoodEditForm
          food={editingFood}
          onClose={() => setEditingFood(null)}
          onSave={async (foodId, nutrients) => {
            await updateFood(foodId, nutrients);
          }}
        />
      )}
    </PageContainer>
  );
}
