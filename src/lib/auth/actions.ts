"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthError {
  error: string;
}

/**
 * Sign in with email + password.
 * On success the session cookie is set and we redirect to the Main page
 * (server-side redirect — reliable, refreshes auth state). On failure the
 * error is returned so the form can show it.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<AuthError | void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/");
}

/** Register with email + password, then redirect to the Main page. */
export async function signUp(
  email: string,
  password: string,
): Promise<AuthError | void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/");
}

/** Sign the current user out and return to the Main page. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}
