-- LMS schema for Supabase Postgres
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null,
  detailed_description text not null,
  category text not null check (category in ('in-an','thiet-ke','kinh-doanh')),
  level text not null check (level in ('Cơ bản','Nâng cao')),
  is_best_seller boolean not null default false,
  created_at timestamptz not null default now(),
  students_count int not null default 0,
  rating numeric(2,1) not null default 0,
  price int not null,
  thumbnail text not null,
  intro_video_url text,
  instructor_name text not null,
  instructor_title text not null,
  instructor_avatar text,
  instructor_bio text
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position int not null default 0
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  type text not null check (type in ('video','text')),
  duration text not null,
  summary text,
  content text,
  video_url text,
  position int not null default 0
);

create table if not exists public.course_resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  file_type text not null check (file_type in ('.CDR','.AI','.PSD')),
  preview_image text,
  storage_path text not null
);

create table if not exists public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  course_slug text not null,
  amount int not null,
  coupon_code text,
  transfer_note text not null unique,
  status text not null default 'pending' check (status in ('pending','paid')),
  created_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_slug text not null,
  lesson_id text not null,
  completed boolean not null default false,
  video_second int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.facebook_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  package_name text,
  course_slug text,
  source text not null default 'facebook',
  status text not null default 'new' check (status in ('new','contacted','paid','closed')),
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text not null unique,
  phone text,
  plain_password text not null,
  course_slug text not null,
  order_ref text,
  status text not null default 'active' check (status in ('active','blocked')),
  created_at timestamptz not null default now()
);

create table if not exists public.email_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  subject text not null,
  body text not null,
  status text not null default 'queued' check (status in ('queued','sent','failed')),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.courses enable row level security;
alter table public.chapters enable row level security;
alter table public.lessons enable row level security;
alter table public.course_resources enable row level security;
alter table public.course_reviews enable row level security;
alter table public.orders enable row level security;
alter table public.user_progress enable row level security;
alter table public.facebook_leads enable row level security;
alter table public.customer_accounts enable row level security;
alter table public.email_delivery_logs enable row level security;

-- Read-only public policies for catalog pages
create policy if not exists "public read courses" on public.courses for select using (true);
create policy if not exists "public read chapters" on public.chapters for select using (true);
create policy if not exists "public read lessons" on public.lessons for select using (true);
create policy if not exists "public read resources" on public.course_resources for select using (true);
create policy if not exists "public read reviews" on public.course_reviews for select using (true);

-- Storage bucket setup
insert into storage.buckets (id, name, public)
values ('lms-resources', 'lms-resources', false)
on conflict (id) do nothing;

-- Allow signed URL creation via service role (handled by API route).
-- Optional: allow authenticated users to read objects if needed.
create policy if not exists "authenticated read resource objects"
on storage.objects
for select
to authenticated
using (bucket_id = 'lms-resources');
