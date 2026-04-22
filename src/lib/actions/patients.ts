"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { todayUTCISO } from "@/lib/utils";
import type { Patient } from "@/lib/types";

const patientSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    mrn: z.string().min(1, "MRN is required"),
    date_of_birth: z.string().min(1, "Date of birth is required"),
    notes: z.string().optional().nullable(),
  })
  .refine((v) => v.date_of_birth <= todayUTCISO(), {
    message: "Date of birth cannot be in the future",
    path: ["date_of_birth"],
  });

export type PatientInput = z.infer<typeof patientSchema>;
export type PatientSummary = Patient & {
  flag_count: number;
  flagged_labs: string[];
  latest_panel_at: string | null;
  latest_note_at: string | null;
};

export async function listPatients(search?: string): Promise<Patient[]> {
  const supabase = await createClient();
  let query = supabase
    .from("patients")
    .select("*")
    .order("last_name", { ascending: true });

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(
      `first_name.ilike.${q},last_name.ilike.${q},mrn.ilike.${q}`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listPatientSummaries(): Promise<PatientSummary[]> {
  const [patients, supabase] = await Promise.all([listPatients(), createClient()]);

  const [{ data: labsData, error: labsError }, { data: notesData, error: notesError }] =
    await Promise.all([
      supabase
        .from("labs")
        .select("patient_id, drawn_at, lab_name, value, reference_range_low, reference_range_high")
        .order("drawn_at", { ascending: false }),
      supabase
        .from("clinical_notes")
        .select("patient_id, note_date")
        .order("note_date", { ascending: false }),
    ]);

  if (labsError) throw labsError;
  if (notesError) throw notesError;

  const latestNoteByPatient = new Map<string, string>();
  for (const note of notesData ?? []) {
    if (!latestNoteByPatient.has(note.patient_id)) {
      latestNoteByPatient.set(note.patient_id, note.note_date);
    }
  }

  const latestPanelByPatient = new Map<string, string>();
  const latestPanelLabsByPatient = new Map<
    string,
    {
      lab_name: string;
      value: number;
      reference_range_low: number | null;
      reference_range_high: number | null;
    }[]
  >();

  for (const lab of labsData ?? []) {
    const currentLatest = latestPanelByPatient.get(lab.patient_id);
    if (!currentLatest) {
      latestPanelByPatient.set(lab.patient_id, lab.drawn_at);
      latestPanelLabsByPatient.set(lab.patient_id, [lab]);
      continue;
    }
    if (lab.drawn_at === currentLatest) {
      const current = latestPanelLabsByPatient.get(lab.patient_id) ?? [];
      current.push(lab);
      latestPanelLabsByPatient.set(lab.patient_id, current);
    }
  }

  return patients.map((patient) => {
    const latestPanelAt = latestPanelByPatient.get(patient.id) ?? null;
    const latestNoteAt = latestNoteByPatient.get(patient.id) ?? null;
    const latestLabs = latestPanelLabsByPatient.get(patient.id) ?? [];

    const flaggedLabs = latestLabs
      .filter((lab) => {
        if (lab.reference_range_low == null || lab.reference_range_high == null) return false;
        return lab.value < lab.reference_range_low || lab.value > lab.reference_range_high;
      })
      .map((lab) => lab.lab_name);

    return {
      ...patient,
      flag_count: flaggedLabs.length,
      flagged_labs: Array.from(new Set(flaggedLabs)).slice(0, 5),
      latest_panel_at: latestPanelAt,
      latest_note_at: latestNoteAt,
    };
  });
}

export async function getPatient(id: string): Promise<Patient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPatient(input: PatientInput) {
  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/");
  return { id: data.id };
}

export async function updatePatient(id: string, input: PatientInput) {
  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("patients")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/patients/${id}`);
  return { ok: true };
}

export async function deletePatient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { ok: true };
}
