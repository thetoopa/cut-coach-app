import { Session } from '@supabase/supabase-js';
import { requireSupabase, supabase } from './supabaseClient';
import { validateUsername } from './profileService';

export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  if (!supabase) return { unsubscribe: () => {} };
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
}

export async function signUpWithProfile(input: { email: string; password: string; displayName: string; username: string }) {
  const client = requireSupabase();
  const username = validateUsername(input.username);
  if (!input.displayName.trim()) throw new Error('Display name is required.');
  if (!input.email.trim() || !input.password) throw new Error('Email and password are required.');

  const { data, error } = await client.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        display_name: input.displayName.trim(),
        username,
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Signup succeeded but no user was returned.');
  return data;
}

export async function signIn(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
