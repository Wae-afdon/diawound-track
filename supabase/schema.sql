-- DiaWound Track Supabase schema
-- Prototype note: this schema uses JSONB payload columns to preserve the current
-- React/TypeScript data model while still enabling cross-device sync.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  role text check (role in ('patient', 'doctor', 'chw', 'admin')),
  display_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create table if not exists patients (
  id text primary key,
  patient_code text not null,
  care_path text not null check (care_path in ('doctor', 'chw')),
  assigned_doctor text,
  assigned_chw text,
  source_channel text not null,
  created_at timestamptz not null default now(),
  payload jsonb not null
);

create table if not exists assessments (
  id text primary key,
  patient_id text not null,
  patient_code text not null,
  review_status text not null check (review_status in ('pending', 'confirmed', 'corrected')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'urgent')),
  clinical_phase text not null check (clinical_phase in ('phase1', 'phase2', 'phase3', 'phase4', 'phase5')),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  payload jsonb not null
);

create table if not exists doctor_corrections (
  id text primary key,
  patient_id text not null,
  assessment_id text not null,
  corrected_by text not null,
  created_at timestamptz not null default now(),
  payload jsonb not null
);

create table if not exists daily_reminders (
  id text primary key,
  patient_id text not null,
  frequency text not null,
  reminder_time text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  payload jsonb not null
);

create table if not exists clinic_partners (
  id text primary key,
  name text not null,
  type text not null check (type in ('clinic', 'hospital', 'rhpc')),
  uses_diawound_track boolean not null default true,
  payload jsonb not null
);

create table if not exists doctor_dataset_entries (
  id text primary key,
  source_type text not null,
  wound_type text not null,
  clinical_phase text not null,
  image_url text,
  created_at timestamptz not null default now(),
  payload jsonb not null
);

create table if not exists chw_consultation_cases (
  id text primary key,
  patient_id text not null,
  assessment_id text not null,
  chw_id text not null,
  status text not null check (status in ('pending', 'reviewed', 'referred', 'urgent')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  payload jsonb not null
);

create index if not exists assessments_patient_id_idx on assessments(patient_id);
create index if not exists assessments_review_status_idx on assessments(review_status);
create index if not exists doctor_corrections_assessment_id_idx on doctor_corrections(assessment_id);
create index if not exists daily_reminders_patient_id_idx on daily_reminders(patient_id);
create index if not exists chw_consultation_cases_patient_id_idx on chw_consultation_cases(patient_id);

insert into storage.buckets (id, name, public)
values ('wound-images', 'wound-images', true)
on conflict (id) do update set public = true;

-- Prototype-only Storage policies for direct browser uploads with the anon key.
-- Production should replace these with Supabase Auth, RLS, signed URLs,
-- patient consent/privacy rules, and role-based permissions.
drop policy if exists "Public wound image read" on storage.objects;
create policy "Public wound image read"
on storage.objects for select
using (bucket_id = 'wound-images');

drop policy if exists "Prototype wound image upload" on storage.objects;
create policy "Prototype wound image upload"
on storage.objects for insert
with check (bucket_id = 'wound-images');

drop policy if exists "Prototype wound image update" on storage.objects;
create policy "Prototype wound image update"
on storage.objects for update
using (bucket_id = 'wound-images')
with check (bucket_id = 'wound-images');
