import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

function formatFoodNameForStorage(name) {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function normalizeFoodNameForLookup(name) {
  return name.trim().toLowerCase();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findDuplicateId(formattedName, currentId) {
  const { data, error } = await supabase
    .from("foods")
    .select("id, name")
    .ilike("name", formattedName)
    .neq("id", currentId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

async function mergeIntoExistingFood(fromId, toId) {
  const { error: logError } = await supabase
    .from("log_entries")
    .update({ food_id: toId })
    .eq("food_id", fromId);

  if (logError) {
    throw new Error(logError.message);
  }

  const { error: presetError } = await supabase
    .from("meal_preset_items")
    .update({ food_id: toId })
    .eq("food_id", fromId);

  if (presetError && presetError.code !== "42P01") {
    throw new Error(presetError.message);
  }

  const { error: deleteError } = await supabase
    .from("foods")
    .delete()
    .eq("id", fromId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

async function main() {
  const { data: foods, error } = await supabase
    .from("foods")
    .select("id, name")
    .order("id");

  if (error) {
    throw new Error(error.message);
  }

  let updated = 0;
  let merged = 0;
  let skipped = 0;

  for (const food of foods ?? []) {
    const formatted = formatFoodNameForStorage(food.name);
    if (!formatted || formatted === food.name) {
      skipped += 1;
      continue;
    }

    const duplicateId = await findDuplicateId(formatted, food.id);
    if (duplicateId != null) {
      await mergeIntoExistingFood(food.id, duplicateId);
      merged += 1;
      console.log(
        `Merged "${food.name}" (id ${food.id}) into "${formatted}" (id ${duplicateId})`,
      );
      continue;
    }

    const { error: updateError } = await supabase
      .from("foods")
      .update({ name: formatted })
      .eq("id", food.id);

    if (updateError) {
      throw new Error(`Failed to update id ${food.id}: ${updateError.message}`);
    }

    updated += 1;
    console.log(`Updated "${food.name}" -> "${formatted}"`);
  }

  console.log(
    `Done. Updated ${updated}, merged ${merged}, skipped ${skipped}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
