-- =====================================================================
-- Tutoring OS — multi-tenant schema with Row-Level Security
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. CENTRES (tenants)
-- ---------------------------------------------------------------------
create table if not exists centres (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. PROFILES (teachers/staff) — one row per auth.users, scoped to a centre
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  centre_id    uuid not null references centres(id) on delete cascade,
  display_name text not null,
  role         text not null default 'teacher' check (role in ('teacher', 'admin')),
  created_at   timestamptz not null default now()
);

create index if not exists profiles_centre_id_idx on profiles(centre_id);

-- ---------------------------------------------------------------------
-- 3. STUDENTS — scoped to a centre
-- ---------------------------------------------------------------------
create table if not exists students (
  id           uuid primary key default gen_random_uuid(),
  centre_id    uuid not null references centres(id) on delete cascade,
  name         text not null,
  grade_level  text,
  created_at   timestamptz not null default now()
);

create index if not exists students_centre_id_idx on students(centre_id);
create index if not exists students_name_idx on students using gin (to_tsvector('simple', name));

-- ---------------------------------------------------------------------
-- 4. GRADING RESULTS — structured, per-question output from the AI layer
--    NOTE: no image/file columns exist anywhere in this schema by design.
--    Only extracted text data is ever persisted (zero-image-storage policy).
-- ---------------------------------------------------------------------
create table if not exists grading_results (
  id                    uuid primary key default gen_random_uuid(),
  centre_id             uuid not null references centres(id) on delete cascade,
  student_id            uuid not null references students(id) on delete cascade,
  created_by            uuid references profiles(id) on delete set null,
  question_number       text not null,
  sub_question_blank    text,
  subject               text not null,
  student_answer        text,
  correct_answer        text,
  is_correct            boolean not null,
  explanation_cantonese text,
  topic_tags            text[] not null default '{}',
  created_at            timestamptz not null default now()
);

create index if not exists grading_results_centre_id_idx on grading_results(centre_id);
create index if not exists grading_results_student_id_idx on grading_results(student_id);

-- ---------------------------------------------------------------------
-- 5. RLS: enable on every tenant-scoped table
-- ---------------------------------------------------------------------
alter table centres          enable row level security;
alter table profiles         enable row level security;
alter table students         enable row level security;
alter table grading_results  enable row level security;

-- Helper: the calling user's centre_id, read from their own profile row.
-- SECURITY DEFINER + fixed search_path so it can't be hijacked, and it
-- only ever reads the row matching auth.uid() — never an arbitrary id.
create or replace function auth_centre_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select centre_id from profiles where id = auth.uid()
$$;

-- --- centres: a user may see only their own centre's row ---
drop policy if exists "centres_select_own" on centres;
create policy "centres_select_own" on centres
  for select using (id = auth_centre_id());

-- --- profiles: a user may see only profiles in their own centre ---
drop policy if exists "profiles_select_same_centre" on profiles;
create policy "profiles_select_same_centre" on profiles
  for select using (centre_id = auth_centre_id());

drop policy if exists "profiles_update_self" on profiles;
create policy "profiles_update_self" on profiles
  for update using (id = auth.uid());

-- --- students: full CRUD, but only within the caller's own centre ---
drop policy if exists "students_select_same_centre" on students;
create policy "students_select_same_centre" on students
  for select using (centre_id = auth_centre_id());

drop policy if exists "students_insert_same_centre" on students;
create policy "students_insert_same_centre" on students
  for insert with check (centre_id = auth_centre_id());

drop policy if exists "students_update_same_centre" on students;
create policy "students_update_same_centre" on students
  for update using (centre_id = auth_centre_id())
  with check (centre_id = auth_centre_id());

drop policy if exists "students_delete_same_centre" on students;
create policy "students_delete_same_centre" on students
  for delete using (centre_id = auth_centre_id());

-- --- grading_results: full CRUD, but only within the caller's own centre ---
drop policy if exists "grading_select_same_centre" on grading_results;
create policy "grading_select_same_centre" on grading_results
  for select using (centre_id = auth_centre_id());

drop policy if exists "grading_insert_same_centre" on grading_results;
create policy "grading_insert_same_centre" on grading_results
  for insert with check (centre_id = auth_centre_id());

drop policy if exists "grading_update_same_centre" on grading_results;
create policy "grading_update_same_centre" on grading_results
  for update using (centre_id = auth_centre_id())
  with check (centre_id = auth_centre_id());

drop policy if exists "grading_delete_same_centre" on grading_results;
create policy "grading_delete_same_centre" on grading_results
  for delete using (centre_id = auth_centre_id());

-- ---------------------------------------------------------------------
-- 6. Realtime: broadcast changes so multiple teacher devices stay in sync
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table grading_results;
alter publication supabase_realtime add table students;
