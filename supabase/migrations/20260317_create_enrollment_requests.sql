-- Fix missing enrollment_requests table in Supabase
-- Run this in Supabase SQL Editor, then refresh admin page.

create extension if not exists pgcrypto;

create table if not exists public.enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  package_name text,
  course_slug text not null,
  order_ref text unique,
  transfer_note text,
  status text not null default 'new' check (status in ('new','contacted','paid','closed')),
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.enrollment_requests enable row level security;

-- Force PostgREST to reload schema cache immediately.
select pg_notify('pgrst', 'reload schema');
