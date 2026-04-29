import { CommunityMeal, UserProfile } from '../types/social';
import { requireSupabase } from './supabaseClient';
import { getCurrentProfile } from './profileService';

function fromMealRow(row: any): CommunityMeal {
  return {
    id: row.id,
    createdByUserId: row.created_by_user_id,
    creatorUsername: row.creator_username,
    creatorDisplayName: row.creator_display_name,
    creatorAvatarUrl: row.creator_avatar_url ?? undefined,
    name: row.name,
    category: row.category,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    servingSize: row.serving_size ?? undefined,
    ingredients: row.ingredients ?? [],
    instructions: row.instructions ?? [],
    tags: row.tags ?? [],
    isPrivate: !!row.is_private,
    likesCount: row.likes_count ?? 0,
    savesCount: row.saves_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function categoryToDb(type: string): CommunityMeal['category'] {
  const lower = type.toLowerCase();
  if (lower === 'breakfast' || lower === 'lunch' || lower === 'dinner' || lower === 'snack') return lower;
  return 'snack';
}

export function communityMealToLocalMeal(meal: CommunityMeal) {
  return {
    id: `community-${meal.id}`,
    name: meal.name,
    type: meal.category === 'breakfast' ? 'Breakfast' : meal.category === 'lunch' ? 'Lunch' : meal.category === 'dinner' ? 'Dinner' : 'Snack',
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    custom: true,
    notes: `${meal.servingSize ?? 'Serving size not specified.'}\n\nBy ${meal.creatorDisplayName} @${meal.creatorUsername}\n\nIngredients:\n${meal.ingredients.join('\n')}\n\nInstructions:\n${meal.instructions.join('\n')}`,
  };
}

export async function uploadMealToCommunity(localMeal: any, isPrivate = false, profileOverride?: UserProfile | null) {
  const client = requireSupabase();
  const profile = profileOverride ?? await getCurrentProfile();
  if (!profile) throw new Error('Create your profile before sharing a meal.');
  const ingredients = String(localMeal.notes ?? '').split('\n').filter((line: string) => line.trim()).slice(0, 20);
  const payload = {
    created_by_user_id: profile.id,
    creator_username: profile.username,
    creator_display_name: profile.displayName,
    creator_avatar_url: profile.avatarUrl,
    name: localMeal.name,
    category: categoryToDb(localMeal.type),
    calories: Math.round(localMeal.calories || 0),
    protein: Math.round(localMeal.protein || 0),
    carbs: Math.round(localMeal.carbs || 0),
    fat: Math.round(localMeal.fat || 0),
    serving_size: '1 serving',
    ingredients,
    instructions: ['See meal notes.'],
    tags: ['community'],
    is_private: isPrivate,
  };
  const { data, error } = await client.from('community_meals').insert(payload).select('*').single();
  if (error) throw error;
  return fromMealRow(data);
}

export async function searchCommunityMeals(query: string, category?: CommunityMeal['category'] | 'all') {
  const client = requireSupabase();
  let request = client
    .from('community_meals')
    .select('*')
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .limit(50);
  const term = query.trim();
  if (term) request = request.or(`name.ilike.%${term}%,creator_username.ilike.%${term}%`);
  if (category && category !== 'all') request = request.eq('category', category);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []).map(fromMealRow);
}

export async function getCommunityMealById(id: string) {
  const client = requireSupabase();
  const { data, error } = await client.from('community_meals').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? fromMealRow(data) : null;
}

export function saveCommunityMealToMyMeals(meal: CommunityMeal) {
  return communityMealToLocalMeal(meal);
}

export async function toggleMealPrivacy(id: string, isPrivate: boolean) {
  const client = requireSupabase();
  const { data, error } = await client.from('community_meals').update({ is_private: isPrivate, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
  if (error) throw error;
  return fromMealRow(data);
}

export async function incrementMealSaveCount(id: string) {
  const meal = await getCommunityMealById(id);
  if (!meal) return null;
  const client = requireSupabase();
  const { data, error } = await client.from('community_meals').update({ saves_count: meal.savesCount + 1 }).eq('id', id).select('*').single();
  if (error) throw error;
  return fromMealRow(data);
}
