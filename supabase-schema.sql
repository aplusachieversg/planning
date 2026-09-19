-- APLUS Academic Planner — Supabase database schema
create table if not exists public.student_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id text not null unique,
  student_name text,
  parent_name text,
  email text,
  phone text,
  current_level text,
  qualification text,
  target_field text,
  target_university text,
  target_course text,
  entry_year integer,
  academic_profile text,
  subjects jsonb default '[]'::jsonb,
  activities jsonb default '[]'::jsonb,
  master_profile jsonb not null,
  gap_analysis jsonb default '{}'::jsonb,
  roadmap jsonb default '[]'::jsonb,
  application_status text not null default 'New',
  scholarship_interest boolean not null default false,
  consent_given boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_submissions_student_id_idx on public.student_submissions(student_id);
create index if not exists student_submissions_target_idx on public.student_submissions(target_university,target_course,entry_year);
create index if not exists student_submissions_status_idx on public.student_submissions(application_status);

alter table public.student_submissions enable row level security;

drop policy if exists "public can submit with consent" on public.student_submissions;
create policy "public can submit with consent"
on public.student_submissions for insert to anon
with check (consent_given = true);

drop policy if exists "authenticated admins can read" on public.student_submissions;
create policy "authenticated admins can read"
on public.student_submissions for select to authenticated
using (true);

drop policy if exists "authenticated admins can update" on public.student_submissions;
create policy "authenticated admins can update"
on public.student_submissions for update to authenticated
using (true) with check (true);

create or replace function public.set_student_submission_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists student_submissions_updated_at on public.student_submissions;
create trigger student_submissions_updated_at
before update on public.student_submissions
for each row execute function public.set_student_submission_updated_at();

-- Create an Admin user in Supabase Authentication.
-- Do NOT put a service-role key in this website.
