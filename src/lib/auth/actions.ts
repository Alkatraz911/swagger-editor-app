"use server";

import { createClient } from "@/lib/supabase/server";

export interface AuthResult {
  error: string | null;
}

/** Sign in with email + password. Never throws — returns a typed result. */
export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

/** Register with email + password. Never throws — returns a typed result. */
export async function signUp(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  return { error: error?.message ?? null };
}

/** Sign the current user out. */
export async function signOut(): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}
