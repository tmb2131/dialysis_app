"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Combobox } from "@/components/ui/combobox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  createMedication,
  replaceMedication,
  updateMedication,
} from "@/lib/actions/medications";
import { todayLocalISO } from "@/lib/utils";
import type { Medication } from "@/lib/types";

type Props =
  | {
      mode: "create";
      patientId: string;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      nameSuggestions: string[];
      medication?: undefined;
    }
  | {
      mode: "edit";
      patientId: string;
      medication: Medication;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      nameSuggestions: string[];
    };

type EditMode = "edit-in-place" | "end-and-start-new";

export function MedicationForm(props: Props) {
  const { patientId, open, onOpenChange, nameSuggestions } = props;
  const isEdit = props.mode === "edit";
  const medication = isEdit ? props.medication : undefined;
  const router = useRouter();

  const [name, setName] = React.useState(medication?.name ?? "");
  const [dose, setDose] = React.useState(
    medication?.dose != null ? String(medication.dose) : "",
  );
  const [unit, setUnit] = React.useState(medication?.unit ?? "");
  const [frequency, setFrequency] = React.useState(medication?.frequency ?? "");
  const [startDate, setStartDate] = React.useState(
    medication?.start_date ?? todayLocalISO(),
  );
  const [endDate, setEndDate] = React.useState(medication?.end_date ?? "");
  const [notes, setNotes] = React.useState(medication?.notes ?? "");
  const [editMode, setEditMode] = React.useState<EditMode>("edit-in-place");
  const [newStartDate, setNewStartDate] = React.useState(
    todayLocalISO(),
  );
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(medication?.name ?? "");
      setDose(medication?.dose != null ? String(medication.dose) : "");
      setUnit(medication?.unit ?? "");
      setFrequency(medication?.frequency ?? "");
      setStartDate(medication?.start_date ?? todayLocalISO());
      setEndDate(medication?.end_date ?? "");
      setNotes(medication?.notes ?? "");
      setEditMode("edit-in-place");
      setNewStartDate(todayLocalISO());
    }
  }, [open, medication]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Medication name is required.");
      return;
    }
    if (!startDate) {
      toast.error("Start date is required.");
      return;
    }

    const doseNum = dose.trim() ? Number(dose) : null;
    if (doseNum != null && !Number.isFinite(doseNum)) {
      toast.error("Dose must be a number.");
      return;
    }

    if (endDate && endDate < startDate) {
      toast.error("End date must be on or after start date.");
      return;
    }

    const payload = {
      patient_id: patientId,
      name: name.trim(),
      dose: doseNum,
      unit: unit.trim() || null,
      frequency: frequency.trim() || null,
      start_date: startDate,
      end_date: endDate || null,
      notes: notes.trim() || null,
    };

    setSubmitting(true);
    let result: { ok?: boolean; error?: string };
    if (!isEdit) {
      result = await createMedication(payload);
    } else if (editMode === "edit-in-place") {
      result = await updateMedication({ ...payload, id: medication!.id });
    } else {
      // end-and-start-new: end the existing, create a fresh one starting on newStartDate
      result = await replaceMedication({
        id: medication!.id,
        patient_id: patientId,
        new_start_date: newStartDate,
        new: { ...payload, start_date: newStartDate, end_date: null },
      });
    }
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      !isEdit
        ? "Medication added"
        : editMode === "edit-in-place"
          ? "Medication updated"
          : "Prescription change recorded",
    );
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {!isEdit ? "Add medication" : "Edit medication"}
          </DialogTitle>
          {!isEdit && (
            <DialogDescription>
              Record a new medication for this patient.
            </DialogDescription>
          )}
        </DialogHeader>

        {isEdit && (
          <div className="rounded-md border bg-muted/30 p-3">
            <RadioGroup
              value={editMode}
              onValueChange={(v) => setEditMode(v as EditMode)}
              className="gap-2"
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="edit-in-place" id="edit-in-place" className="mt-0.5" />
                <Label htmlFor="edit-in-place" className="font-normal leading-snug">
                  <span className="font-medium">Edit in place</span>
                  <span className="block text-xs text-muted-foreground">
                    Correcting a typo or missing info — no change to the
                    prescription history.
                  </span>
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <RadioGroupItem
                  value="end-and-start-new"
                  id="end-and-start-new"
                  className="mt-0.5"
                />
                <Label htmlFor="end-and-start-new" className="font-normal leading-snug">
                  <span className="font-medium">End current, start new</span>
                  <span className="block text-xs text-muted-foreground">
                    The prescription actually changed — keep the old record and
                    create a new entry from the change date.
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Combobox
              id="name"
              value={name}
              onChange={setName}
              suggestions={nameSuggestions}
              placeholder="e.g. Sevelamer"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dose">Dose</Label>
              <Input
                id="dose"
                inputMode="decimal"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="text-right tabular-nums"
                placeholder="e.g. 800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="mg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="3x weekly"
              />
            </div>
          </div>

          {isEdit && editMode === "end-and-start-new" ? (
            <div className="space-y-2">
              <Label htmlFor="new_start">Change date (new Rx starts)</Label>
              <Input
                id="new_start"
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                The old entry will be ended the day before this date.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">
                  End date{" "}
                  <span className="font-normal text-muted-foreground">
                    (blank = active)
                  </span>
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  min={startDate || undefined}
                  value={endDate ?? ""}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='e.g. "increased due to rising phosphorus"'
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
