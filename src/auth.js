// ════════════════════════════════════════
//  Authentication helpers (Supabase Auth)
// ════════════════════════════════════════

import { supabase } from './db/client.js';

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
