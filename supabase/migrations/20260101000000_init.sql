-- Dialysis patient tracker schema

create extension if not exists "uuid-ossp";

-- =================== Tables ===================

create table if not exists public.patients (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz not null default now(),
    first_name text not null,
    last_name text not null,
    mrn text not null unique,
    date_of_birth date not null,
    notes text
);

create table if not exists public.labs (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz not null default now(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    drawn_at date not null,
    lab_name text not null,
    value numeric not null,
    unit text,
    reference_range_low numeric,
    reference_range_high numeric
);

create index if not exists labs_patient_drawn_idx
    on public.labs (patient_id, drawn_at desc);
create index if not exists labs_patient_name_idx
    on public.labs (patient_id, lab_name);

create table if not exists public.medications (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz not null default now(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    name text not null,
    dose numeric,
    unit text,
    frequency text,
    start_date date not null,
    end_date date,
    notes text
);

create index if not exists medications_patient_start_idx
    on public.medications (patient_id, start_date desc);

-- =================== RLS ===================

alter table public.patients enable row level security;
alter table public.labs enable row level security;
alter table public.medications enable row level security;

drop policy if exists "auth full access patients" on public.patients;
drop policy if exists "auth full access labs" on public.labs;
drop policy if exists "auth full access medications" on public.medications;

create policy "auth full access patients" on public.patients
    for all to authenticated using (true) with check (true);

create policy "auth full access labs" on public.labs
    for all to authenticated using (true) with check (true);

create policy "auth full access medications" on public.medications
    for all to authenticated using (true) with check (true);
