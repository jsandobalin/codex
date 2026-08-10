import { supabase } from './supabase-client.js';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Falta la configuración de Supabase. Crea public/runtime-config.js a partir del archivo de ejemplo.');
  }
  return supabase;
}

export async function currentClaims() {
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session?.access_token) return null;

  const { data, error } = await client.auth.getClaims();
  if (error) throw error;
  return data?.claims ?? null;
}

export async function signIn(email, password) {
  const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email, password) {
  const { data, error } = await requireSupabase().auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}

export function onAuthChange(callback) {
  return requireSupabase().auth.onAuthStateChange(callback).data.subscription;
}
