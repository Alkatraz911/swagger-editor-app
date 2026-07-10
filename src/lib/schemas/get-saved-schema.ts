import { createClient } from "@/lib/supabase/server";
import type { SchemaRow } from "@/lib/supabase/types";

export type SavedSchema = Pick<SchemaRow, "content" | "format">;

export async function getSavedSchema(
  userId: string,
): Promise<SavedSchema | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schemas")
    .select("content, format")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}
