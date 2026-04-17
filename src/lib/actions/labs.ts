"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Lab } from "@/lib/types";

const labEntrySchema = z.object({
  lab_name: z.string().min(1),
  value: z.number().finite(),
  unit: z.string().optional().nullable(),
  reference_range_low: z.number().finite().optional().nullable(),
  reference_range_high: z.number().finite().optional().nullable(),
});

const panelSchema = z.object({
  patient_id: z.string().uuid(),
  drawn_at: z.string().min(1),
  entries: z.array(labEntrySchema).min(1, "Add at least one lab"),
});

export type LabEntryInput = z.infer<typeof labEntrySchema>;
export type PanelInput = z.infer<typeof panelSchema>;

export async function listLabs(patientId: string): Promise<Lab[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("labs")
    .select("*")
    .eq("patient_id", patientId)
    .order("drawn_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createPanel(input: PanelInput) {
  const parsed = panelSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const rows = parsed.data.entries.map((e) => ({
    patient_id: parsed.data.patient_id,
    drawn_at: parsed.data.drawn_at,
    lab_name: e.lab_name,
    value: e.value,
    unit: e.unit ?? null,
    reference_range_low: e.reference_range_low ?? null,
    reference_range_high: e.reference_range_high ?? null,
  }));
  const { error } = await supabase.from("labs").insert(rows);
  if (error) return { error: error.message };
  revalidatePath(`/patients/${parsed.data.patient_id}`);
  return { ok: true };
}

const labUpdateSchema = labEntrySchema.extend({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  drawn_at: z.string().min(1),
});

export async function updateLab(input: z.infer<typeof labUpdateSchema>) {
  const parsed = labUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, patient_id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("labs").update(rest).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/patients/${patient_id}`);
  return { ok: true };
}

export async function deleteLab(id: string, patientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("labs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}
