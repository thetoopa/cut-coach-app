# Calos Supabase Schema

Run this manually in the Supabase SQL editor. Do not add a service-role key to the Expo app.

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  is_private boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.community_meals (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid references public.profiles(id) on delete cascade,
  creator_username text,
  creator_display_name text,
  creator_avatar_url text,
  name text not null,
  category text not null check (category in ('breakfast', 'lunch', 'dinner', 'snack')),
  calories int not null,
  protein int not null,
  carbs int not null,
  fat int not null,
  serving_size text,
  ingredients jsonb default '[]'::jsonb,
  instructions jsonb default '[]'::jsonb,
  tags text[] default '{}',
  is_private boolean default false,
  likes_count int default 0,
  saves_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_app_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  app_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
```

## RLS

```sql
alter table public.profiles enable row level security;
alter table public.community_meals enable row level security;
alter table public.user_app_state enable row level security;

create policy "Read public profiles"
on public.profiles for select
using (is_private = false or auth.uid() = id);

create policy "Insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Read public or own meals"
on public.community_meals for select
using (is_private = false or auth.uid() = created_by_user_id);

create policy "Insert own community meals"
on public.community_meals for insert
with check (auth.uid() = created_by_user_id);

create policy "Update own community meals"
on public.community_meals for update
using (auth.uid() = created_by_user_id)
with check (auth.uid() = created_by_user_id);

create policy "Delete own community meals"
on public.community_meals for delete
using (auth.uid() = created_by_user_id);

create policy "Read own app state"
on public.user_app_state for select
using (auth.uid() = user_id);

create policy "Insert own app state"
on public.user_app_state for insert
with check (auth.uid() = user_id);

create policy "Update own app state"
on public.user_app_state for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## Avatars Bucket

Create a public Supabase Storage bucket named `avatars`.

Suggested storage policies:

```sql
create policy "Public avatar read"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users upload own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users update own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

## Privacy Defaults

- Profiles are public by default, but users can toggle private.
- Community meals are public by default unless marked private.
- Weight, calories, personal logs, workout logs, and future streak/PR sharing remain private unless explicitly made public later.
- `user_app_state` stores the private Calos app snapshot (intake profile, workouts, meals, logs, grocery settings) and is readable/writable only by the signed-in user.
