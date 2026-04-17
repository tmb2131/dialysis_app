"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Medication } from "@/lib/types";

const medicationSchema = z.object({
  patient_id: z.string().uuid(),
  name: z.string().min(1, "Medication name is required"),
  dose: z.number().finite().nullable().optional(),
  unit: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type MedicationInput = z.infer<typeof medicationSchema>;

export async function listMedications(patientId: string): Promise<Medication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("patient_id", patientId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listMedicationNames(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medications")
    .select("name")
    .order("name", { ascending: true });
  if (error) throw error;
  const set = new Set<string>();
  for (const row of data ?? []) set.add(row.name);
  return Array.from(set);
}

export async function createMedication(input: MedicationInput) {
  const parsed = medicationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("medications").insert({
    ...parsed.data,
    end_date: parsed.data.end_date || null,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/patients/${parsed.data.patient_id}`);
  return { ok: true };
}

const medUpdateSchema = medicationSchema.extend({
  id: z.string().uuid(),
});

export async function updateMedication(input: z.infer<typeof medUpdateSchema>) {
  const parsed = medUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("medications")
    .update({
      ...rest,
      end_date: rest.end_date || null,
      notes: rest.notes || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/patients/${parsed.data.patient_id}`);
  return { ok: true };
}

/**
 * "End current + start new" — preserves history when a prescription changes.
 * Ends the existing med the day before the new one starts, then creates a new
 * medication row starting on `new_start_date`.
 */
export async function replaceMedication(input: {
  id: string;
  patient_id: string;
  new_start_date: string;
  new: MedicationInput;
}) {
  const supabase = await createClient();
  const endDate = new Date(input.new_start_date);
  endDate.setDate(endDate.getDate() - 1);
  const endIso = endDate.toISOString().split("T")[0];

  const { error: endErr } = await supabase
    .from("medications")
    .update({ end_date: endIso })
    .eq("id", input.id);
  if (endErr) return { error: endErr.message };

  const parsed = medicationSchema.safeParse(input.new);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { error: insErr } = await supabase.from("medications").insert({
    ...parsed.data,
    end_date: parsed.data.end_date || null,
    notes: parsed.data.notes || null,
  });
  if (insErr) return { error: insErr.message };
  revalidatePath(`/patients/${input.patient_id}`);
  return { ok: true };
}

export async function deleteMedication(id: string, patientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("medications").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}
