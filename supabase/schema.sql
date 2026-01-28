-- Supabase schema for Anonymous Community Platform

create extension if not exists "pgcrypto";

-- Generic updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Posts (익명 게시판)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  category text not null,
  likes integer not null default 0,
  comments integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

-- Marketplace items (문고리 당근)
create table if not exists public.market_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  type text not null check (type in ('sell', 'free')),
  price text,
  status text not null default 'available' check (status in ('available', 'reserved', 'completed')),
  likes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists market_items_set_updated_at on public.market_items;
create trigger market_items_set_updated_at
before update on public.market_items
for each row execute function public.set_updated_at();

-- Marketplace item images (최대 5장)
create table if not exists public.market_item_images (
  id uuid primary key default gen_random_uuid(),
  market_item_id uuid not null references public.market_items(id) on delete cascade,
  url text not null,
  path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Conversations (메시지 목록)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  last_message text,
  unread boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

-- Messages (메시지 상세)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  content text not null,
  sender_type text not null check (sender_type in ('me', 'other')),
  created_at timestamptz not null default now()
);

-- Keep conversation metadata in sync
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
     set last_message = new.content,
         updated_at = now()
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation_on_message();

-- Indexes
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_category_idx on public.posts(category);

create index if not exists market_items_created_at_idx on public.market_items(created_at desc);
create index if not exists market_items_type_idx on public.market_items(type);
create index if not exists market_items_status_idx on public.market_items(status);
create index if not exists market_item_images_market_item_id_idx on public.market_item_images(market_item_id);
create index if not exists market_item_images_sort_order_idx on public.market_item_images(market_item_id, sort_order);

create index if not exists conversations_updated_at_idx on public.conversations(updated_at desc);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

-- RLS
alter table public.posts enable row level security;
alter table public.market_items enable row level security;
alter table public.market_item_images enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Public policies (anonymous access)
drop policy if exists "posts_select_public" on public.posts;
drop policy if exists "posts_insert_public" on public.posts;
drop policy if exists "posts_update_public" on public.posts;
drop policy if exists "posts_delete_public" on public.posts;

create policy "posts_select_public"
  on public.posts for select
  using (true);

create policy "posts_insert_public"
  on public.posts for insert
  with check (true);

create policy "posts_update_public"
  on public.posts for update
  using (true);

create policy "posts_delete_public"
  on public.posts for delete
  using (true);

drop policy if exists "market_items_select_public" on public.market_items;
drop policy if exists "market_items_insert_public" on public.market_items;
drop policy if exists "market_items_update_public" on public.market_items;
drop policy if exists "market_items_delete_public" on public.market_items;

create policy "market_items_select_public"
  on public.market_items for select
  using (true);

create policy "market_items_insert_public"
  on public.market_items for insert
  with check (true);

create policy "market_items_update_public"
  on public.market_items for update
  using (true);

create policy "market_items_delete_public"
  on public.market_items for delete
  using (true);

drop policy if exists "market_item_images_select_public" on public.market_item_images;
drop policy if exists "market_item_images_insert_public" on public.market_item_images;
drop policy if exists "market_item_images_update_public" on public.market_item_images;
drop policy if exists "market_item_images_delete_public" on public.market_item_images;

create policy "market_item_images_select_public"
  on public.market_item_images for select
  using (true);

create policy "market_item_images_insert_public"
  on public.market_item_images for insert
  with check (true);

create policy "market_item_images_update_public"
  on public.market_item_images for update
  using (true);

create policy "market_item_images_delete_public"
  on public.market_item_images for delete
  using (true);

drop policy if exists "conversations_select_public" on public.conversations;
drop policy if exists "conversations_insert_public" on public.conversations;
drop policy if exists "conversations_update_public" on public.conversations;

create policy "conversations_select_public"
  on public.conversations for select
  using (true);

create policy "conversations_insert_public"
  on public.conversations for insert
  with check (true);

create policy "conversations_update_public"
  on public.conversations for update
  using (true);

drop policy if exists "messages_select_public" on public.messages;
drop policy if exists "messages_insert_public" on public.messages;

create policy "messages_select_public"
  on public.messages for select
  using (true);

create policy "messages_insert_public"
  on public.messages for insert
  with check (true);

-- Storage bucket for marketplace images (public)
insert into storage.buckets (id, name, public)
values ('market-item-images', 'market-item-images', true)
on conflict (id) do update
  set public = excluded.public;

-- Storage policies for marketplace images
drop policy if exists "market_item_images_public_read" on storage.objects;
drop policy if exists "market_item_images_public_insert" on storage.objects;
drop policy if exists "market_item_images_public_delete" on storage.objects;

create policy "market_item_images_public_read"
  on storage.objects for select
  using (bucket_id = 'market-item-images');

create policy "market_item_images_public_insert"
  on storage.objects for insert
  with check (bucket_id = 'market-item-images');

create policy "market_item_images_public_delete"
  on storage.objects for delete
  using (bucket_id = 'market-item-images');
