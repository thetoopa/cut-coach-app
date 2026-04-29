import * as ImagePicker from 'expo-image-picker';
import { requireSupabase } from './supabaseClient';
import { UserProfile } from '../types/social';

const usernameRegex = /^[a-z0-9._]{3,24}$/;
const publicProfileSelect = 'id,username,display_name,avatar_url,bio,is_private,created_at,updated_at';

function fromProfileRow(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email ?? undefined,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    isPrivate: !!row.is_private,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function validateUsername(value: string) {
  const username = value.trim().toLowerCase();
  if (!usernameRegex.test(username)) {
    throw new Error('Username must be 3-24 characters and use only lowercase letters, numbers, underscores, or periods.');
  }
  return username;
}

export async function checkUsernameAvailable(usernameInput: string) {
  const username = validateUsername(usernameInput);
  const client = requireSupabase();
  const { data, error } = await client.from('profiles').select('id').eq('username', username).maybeSingle();
  if (error) throw error;
  return !data;
}

export async function getCurrentProfile() {
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const user = sessionData.session?.user;
  if (!user) return null;
  const { data, error } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data ? fromProfileRow({ ...data, email: user.email }) : null;
}

export async function createProfileAfterSignup(input: { id: string; email?: string; username: string; displayName: string }) {
  const client = requireSupabase();
  const username = validateUsername(input.username);
  const available = await checkUsernameAvailable(username);
  if (!available) throw new Error('That username is already taken.');
  const { data, error } = await client
    .from('profiles')
    .insert({
      id: input.id,
      username,
      display_name: input.displayName.trim(),
      is_private: false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return fromProfileRow({ ...data, email: input.email });
}

export async function updateProfile(patch: Partial<Pick<UserProfile, 'displayName' | 'username' | 'avatarUrl' | 'bio' | 'isPrivate'>>) {
  const client = requireSupabase();
  const current = await getCurrentProfile();
  if (!current) throw new Error('No profile found.');
  const next: Record<string, any> = { updated_at: new Date().toISOString() };
  if (patch.displayName !== undefined) next.display_name = patch.displayName.trim();
  if (patch.username !== undefined) next.username = validateUsername(patch.username);
  if (patch.avatarUrl !== undefined) next.avatar_url = patch.avatarUrl;
  if (patch.bio !== undefined) next.bio = patch.bio;
  if (patch.isPrivate !== undefined) next.is_private = patch.isPrivate;
  const { data, error } = await client.from('profiles').update(next).eq('id', current.id).select('*').single();
  if (error) throw error;
  return fromProfileRow(data);
}

export async function searchPublicProfiles(query: string) {
  const client = requireSupabase();
  const term = query.trim();
  if (term.length < 2) return [];
  const { data, error } = await client
    .from('profiles')
    .select(publicProfileSelect)
    .eq('is_private', false)
    .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
    .limit(25);
  if (error) throw error;
  return (data ?? []).map(fromProfileRow);
}

export async function getPublicProfileByUsername(usernameInput: string) {
  const client = requireSupabase();
  const username = validateUsername(usernameInput);
  const { data, error } = await client.from('profiles').select(publicProfileSelect).eq('username', username).maybeSingle();
  if (error) throw error;
  if (!data || data.is_private) return null;
  return fromProfileRow(data);
}

export async function getCloudAppState() {
  const client = requireSupabase();
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const { data, error } = await client
    .from('user_app_state')
    .select('app_state')
    .eq('user_id', profile.id)
    .maybeSingle();
  if (error) throw error;
  return data?.app_state ?? null;
}

export async function upsertCloudAppState(appState: any) {
  const client = requireSupabase();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('No profile found.');
  const { error } = await client
    .from('user_app_state')
    .upsert({
      user_id: profile.id,
      app_state: appState,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

export async function uploadProfilePicture() {
  const client = requireSupabase();
  const profile = await getCurrentProfile();
  if (!profile) throw new Error('Create your profile before adding an avatar.');
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Photo library permission is required to choose an avatar.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.82,
  });
  if (result.canceled || !result.assets[0]?.uri) return profile;
  const response = await fetch(result.assets[0].uri);
  const blob = await response.blob();
  const path = `${profile.id}/profile.jpg`;
  const { error } = await client.storage.from('avatars').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  const { data } = client.storage.from('avatars').getPublicUrl(path);
  return updateProfile({ avatarUrl: data.publicUrl });
}
