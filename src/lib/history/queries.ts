import { createClient } from "@/lib/supabase/server";
import type { RequestRow } from "@/lib/supabase/types";

/** Fetch the authenticated user's request history, newest first. */
export async function getUserRequests(userId: string): Promise<RequestRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/** Fetch a single request row scoped to the authenticated user. */
export async function getUserRequest(
  userId: string,
  requestId: string,
): Promise<RequestRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("user_id", userId)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
