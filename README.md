# Dialysis Tracker

A single-user web app for a nephrologist to track her dialysis patients' labs
and medications over time. The core feature is a labs-over-time chart with
medication-change markers — glance at a trend and immediately see which
prescription change drove it.

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **Supabase** (Postgres + Auth, via `@supabase/ssr`)
- **Tailwind CSS** + **shadcn/ui** primitives
- **Recharts** for the labs trend chart
- **react-hook-form** + **zod** for forms
- **sonner** for toasts
- **next-themes** for dark mode

## Features

- **Patient list** — searchable by name / MRN.
- **Patient detail** — header with age + MRN.
- **Labs over time chart**
  - Multi-select which labs to plot (defaults to the 3–4 most recently
    entered labs).
  - Reference-range shading when a single lab is selected.
  - **Medication change markers** — vertical lines + a clickable timeline
    below the chart. Click a marker to see exactly what changed on that date.
- **Labs table** — grouped by draw date, with out-of-range flags and a
  panel-entry form that takes multiple labs at once.
- **Medications** — active / past lists, with an edit flow that asks whether
  you're correcting an error (edit in place) or actually changing the
  prescription (end current, start new — preserves history).
- **Autocomplete** for lab names (per-patient) and medication names
  (across all patients), so the second time you enter "Potassium" the
  unit + reference range auto-fill from last time.
- Mobile-friendly: numeric keyboard for lab values, tap-optimised timeline,
  responsive tables.
- Dark mode.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Copy `.env.local.example` to `.env.local` and fill in your Supabase project
URL and anon key:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### 3. Database

Two options:

**a) Supabase CLI (recommended)**

```bash
# Link to your Supabase project
supabase link --project-ref <project-ref>

# Apply the migration
supabase db push

# Load seed data (3 example patients with ~6 months of labs)
psql "$DATABASE_URL" -f supabase/seed.sql
```

**b) Paste in the SQL editor**

Open your Supabase project → SQL editor → run
`supabase/migrations/20260101000000_init.sql`, then run
`supabase/seed.sql`.

The migration:
- creates `patients`, `labs`, `medications` tables with indexes;
- enables Row Level Security on all three tables with a
  "full access for authenticated users" policy (this is a single-user app
  — every authenticated session is the nephrologist).

### 4. Create the first user

There is no registration flow — the account is seeded directly in Supabase.

1. In the Supabase dashboard, go to **Authentication → Users**.
2. Click **Add user → Create new user**.
3. Enter the nephrologist's email and a password, tick "Auto Confirm User",
   and save.

You can also do it from the CLI / API:

```bash
curl -X POST "https://<project>.supabase.co/auth/v1/admin/users" \
  -H "apikey: <service-role-key>" \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"<password>","email_confirm":true}'
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000, sign in, and you're in.

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import into Vercel.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the
   project's environment variables.
4. Deploy. The middleware protects every route except `/login`.

## Project layout

```
src/
  app/
    (app)/                    # protected app shell (header, nav)
      page.tsx                # patient list
      patients/[id]/          # patient detail — chart, labs, meds
    login/                    # public login page
    layout.tsx                # root layout, theme, toaster
  components/
    ui/                       # shadcn/ui primitives (button, dialog, …)
    patient-form.tsx
    app-header.tsx
    theme-provider.tsx
    theme-toggle.tsx
  lib/
    supabase/
      server.ts               # @supabase/ssr server client (cookies)
      middleware.ts           # session refresh + route protection
    actions/                  # server actions (patients, labs, medications)
    types.ts                  # DB row types
    utils.ts                  # cn(), date helpers, age calc
  middleware.ts               # wires updateSession into Next middleware
supabase/
  migrations/                 # schema + RLS
  seed.sql                    # demo data
```

## Data model

- **patients** — `id`, `created_at`, `first_name`, `last_name`, `mrn` (unique),
  `date_of_birth`, `notes`.
- **labs** — one row per lab value. `lab_name` is free text, so new labs can
  be added without schema changes. Grouping by `drawn_at` gives the panel view.
- **medications** — one row per prescription. Changing a dose means ending the
  current row and inserting a new one so the history is preserved. The chart
  renders a marker for each `start_date` and `end_date`.

All DB access is via server actions (`src/lib/actions/*`). Client components
never touch Supabase directly.

## Seed data

`supabase/seed.sql` creates three demonstrative patients, each with ~12 bi-weekly
lab panels spanning six months (Potassium, Phosphorus, Hemoglobin, Calcium,
PTH, Creatinine) and 2–3 medications:

- **Eleanor Hayes** — iron sucrose started mid-timeline → hemoglobin rises
  from 8.8 to 11.6 g/dL.
- **Marcus Okafor** — calcium acetate switched to sevelamer mid-timeline →
  phosphorus drops from 7.2 to 4.8 mg/dL.
- **Priya Shah** — cinacalcet started then dose-increased → PTH falls from
  680 to 270 pg/mL.

Open any of them to see the medication marker / lab trend correlation
immediately.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # run built app
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```
