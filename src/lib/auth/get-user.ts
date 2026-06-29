import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the currently authenticated user, or null.
 * Use in Server Components, Route Handlers and Server Actions.
 * Shared helper — B (save schema) and C (history) read auth state through this.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
