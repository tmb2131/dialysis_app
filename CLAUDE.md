# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server on http://localhost:3000 (expects hosted Supabase URL+key in .env.local)
npm run dev:local  # dev against local `supabase start` (sets SUPABASE_USE_LOCAL_DEV)
npm run build      # production build
npm run start      # run built app
npm run lint       # eslint (next lint)
npm run typecheck  # tsc --noEmit
```

There is no test suite.

Database work uses the Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push                           # apply migrations in supabase/migrations/
psql "$DATABASE_URL" -f supabase/seed.sql  # demo patients
```

Environment: copy `.env.local.example` → `.env.local` with the **same** Supabase
URL and anon/publishable key as production (unless you use `npm run dev:local` for
local `supabase start`). Either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (newer
`sb_publishable_…`) or `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy JWT) works — the
resolution lives in `src/lib/supabase/env.ts`.

## Architecture

Single-user Next.js 15 App Router app backed by Supabase (Postgres + Auth).
The nephrologist is the only user; every authenticated session has full
access, enforced by a blanket "authenticated users" RLS policy on all tables.

### Auth + routing

- `src/middleware.ts` wires `updateSession` from `src/lib/supabase/middleware.ts`
  into Next's edge middleware. It refreshes the Supabase session cookie on every
  request and **redirects unauthenticated users to `/login`** for any route
  that isn't `/login`, `/api/auth`, or a static asset. Authenticated users
  hitting `/login` are redirected to `/`.
- `src/app/(app)/` is the protected app shell (header, nav, patient list,
  patient detail). `src/app/login/` is the only public route.

### Data flow: Server Actions only

Client components **never** touch Supabase directly. All DB access goes
through server actions in `src/lib/actions/` (`patients.ts`, `labs.ts`,
`medications.ts`, `notes.ts`). The pattern in every action file:

1. Zod schema validates input; failures return `{ error }` rather than throw.
2. `createClient()` from `src/lib/supabase/server.ts` builds a cookie-bound
   server client (reads cookies via `next/headers`; writes are guarded in a
   try/catch for Server Component contexts where the middleware handles
   refresh).
3. Mutations call `revalidatePath(...)` so the patient detail page re-renders
   after writes.

When adding a feature that reads or writes data, add or extend an action in
`src/lib/actions/` and call it from a `"use client"` form component — do not
introduce a browser-side Supabase client.

### Domain model (`src/lib/types.ts`, `supabase/migrations/`)

- **patients** — `mrn` is unique; `date_of_birth` drives the age shown in the
  header.
- **labs** — one row per value; `lab_name` is free text so new labs don't
  need migrations. The UI groups rows by `drawn_at` to form a panel, and
  autocomplete reuses the last-seen `unit`/`reference_range_*` for a lab
  name **per patient**.
- **medications** — one row per prescription. **History is preserved by
  "end current + start new"**, not by editing in place. `replaceMedication`
  in `src/lib/actions/medications.ts` is the canonical implementation: it
  sets the old row's `end_date` to the day before the new `start_date` and
  inserts a new row. `updateMedication` is reserved for correcting errors on
  the existing prescription. This distinction is user-visible (the edit
  dialog asks "correcting an error?" vs "changing the prescription?") — keep
  the two paths separate when touching medication code.
- **clinical_notes** — added in a later migration; `note_date` is the
  clinical date (distinct from `created_at`).

The labs chart (`src/app/(app)/patients/[id]/labs-chart.tsx`) joins labs +
medications: each medication `start_date` and `end_date` becomes a vertical
marker on the timeline, so the "history-preserving" medication model is what
makes the chart meaningful. Reference-range shading only renders when exactly
one lab is selected.

### UI conventions

- shadcn/ui primitives live in `src/components/ui/` — extend these rather
  than pulling in new Radix components ad-hoc.
- Forms use `react-hook-form` + `zod` (same schema shape as the server
  action where practical) and `sonner` for toast feedback.
- `@/*` resolves to `src/*` (see `tsconfig.json`).
- Dark mode via `next-themes`; `ThemeProvider` wraps the root layout.

### Server Action body size

`next.config.ts` raises the Server Action body limit to 2mb. If you add an
action that accepts larger payloads (e.g. bulk lab imports), bump this rather
than working around it.
