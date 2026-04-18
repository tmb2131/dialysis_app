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
