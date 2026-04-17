"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPatient, updatePatient } from "@/lib/actions/patients";
import type { Patient } from "@/lib/types";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  mrn: z.string().min(1, "Required"),
  date_of_birth: z.string().min(1, "Required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function PatientForm({
  open,
  onOpenChange,
  patient,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
}) {
  const router = useRouter();
  const isEdit = Boolean(patient);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: patient?.first_name ?? "",
      last_name: patient?.last_name ?? "",
      mrn: patient?.mrn ?? "",
      date_of_birth: patient?.date_of_birth ?? "",
      notes: patient?.notes ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        first_name: patient?.first_name ?? "",
        last_name: patient?.last_name ?? "",
        mrn: patient?.mrn ?? "",
        date_of_birth: patient?.date_of_birth ?? "",
        notes: patient?.notes ?? "",
      });
    }
  }, [open, patient, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      notes: values.notes || null,
    };
    const result = isEdit
      ? await updatePatient(patient!.id, payload)
      : await createPatient(payload);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Patient updated" : "Patient added");
    onOpenChange(false);
    router.refresh();
    if (!isEdit && "id" in result && result.id) {
      router.push(`/patients/${result.id}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit patient" : "Add patient"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update patient details." : "Create a new patient record."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" autoFocus {...register("first_name")} />
              {errors.first_name && (
                <p className="text-xs text-destructive">
                  {errors.first_name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" {...register("last_name")} />
              {errors.last_name && (
                <p className="text-xs text-destructive">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mrn">MRN</Label>
              <Input id="mrn" {...register("mrn")} />
              {errors.mrn && (
                <p className="text-xs text-destructive">{errors.mrn.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register("date_of_birth")}
              />
              {errors.date_of_birth && (
                <p className="text-xs text-destructive">
                  {errors.date_of_birth.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Optional notes…"
              {...register("notes")}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
