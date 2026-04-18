"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { todayUTCISO } from "@/lib/utils";
import type { ClinicalNote } from "@/lib/types";

const noteBaseSchema = z.object({
  patient_id: z.string().uuid(),
  note_date: z.string().min(1, "Date is required"),
  content: z.string().min(1, "Note content is required"),
});

const noteDateNotInFuture = (v: { note_date: string }) =>
  v.note_date <= todayUTCISO();

const noteSchema = noteBaseSchema.refine(noteDateNotInFuture, {
  message: "Note date cannot be in the future",
  path: ["note_date"],
});

export type NoteInput = z.infer<typeof noteSchema>;

export async function listNotes(patientId: string): Promise<ClinicalNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinical_notes")
    .select("*")
    .eq("patient_id", patientId)
    .order("note_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createNote(input: NoteInput) {
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("clinical_notes").insert({
    ...parsed.data,
    content: parsed.data.content.trim(),
  });
  if (error) return { error: error.message };
  revalidatePath(`/patients/${parsed.data.patient_id}`);
  return { ok: true };
}

const noteUpdateSchema = noteBaseSchema
  .extend({ id: z.string().uuid() })
  .refine(noteDateNotInFuture, {
    message: "Note date cannot be in the future",
    path: ["note_date"],
  });

export async function updateNote(input: z.infer<typeof noteUpdateSchema>) {
  const parsed = noteUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, ...rest } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("clinical_notes")
    .update({
      ...rest,
      content: rest.content.trim(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/patients/${parsed.data.patient_id}`);
  return { ok: true };
}

export async function deleteNote(id: string, patientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clinical_notes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/patients/${patientId}`);
  return { ok: true };
}
