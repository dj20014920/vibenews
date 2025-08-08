-- Create public.users profile table
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null,
  provider text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS and policies for users
alter table public.users enable row level security;

create policy if not exists "Profiles are viewable by everyone"
  on public.users for select
  using (true);

create policy if not exists "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy if not exists "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- Updated_at trigger for users
create trigger if not exists update_users_updated_at
before update on public.users
for each row execute function public.update_updated_at_column();

-- Create user_preferences table
create table if not exists public.user_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  theme text not null default 'system',
  language text not null default 'ko',
  content_mode text not null default 'developer',
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  anonymous_mode_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS and policies for user_preferences
alter table public.user_preferences enable row level security;

create policy if not exists "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- Updated_at trigger for user_preferences
create trigger if not exists update_user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.update_updated_at_column();

-- Triggers on auth.users to auto-create related records
-- Preference auto-insert
drop trigger if exists on_auth_user_created_preferences on auth.users;
create trigger on_auth_user_created_preferences
  after insert on auth.users
  for each row execute procedure public.handle_new_user_preferences();

-- Security settings auto-insert
drop trigger if exists on_auth_user_created_security on auth.users;
create trigger on_auth_user_created_security
  after insert on auth.users
  for each row execute procedure public.create_user_security_settings();