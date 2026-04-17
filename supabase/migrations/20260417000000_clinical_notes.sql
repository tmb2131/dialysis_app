-- Clinical notes: free-form, date-stamped events that may affect labs or medications.

create table if not exists public.clinical_notes (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamptz not null default now(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    note_date date not null,
    content text not null
);

create index if not exists clinical_notes_patient_date_idx
    on public.clinical_notes (patient_id, note_date desc);

alter table public.clinical_notes enable row level security;

drop policy if exists "auth full access clinical_notes" on public.clinical_notes;

create policy "auth full access clinical_notes" on public.clinical_notes
    for all to authenticated using (true) with check (true);
