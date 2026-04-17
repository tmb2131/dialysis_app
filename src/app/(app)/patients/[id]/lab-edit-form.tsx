"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { updateLab } from "@/lib/actions/labs";
import type { Lab } from "@/lib/types";

export function LabEditForm({
  open,
  onOpenChange,
  lab,
  nameSuggestions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lab: Lab;
  nameSuggestions: string[];
}) {
  const router = useRouter();
  const [name, setName] = React.useState(lab.lab_name);
  const [date, setDate] = React.useState(lab.drawn_at);
  const [value, setValue] = React.useState(String(lab.value));
  const [unit, setUnit] = React.useState(lab.unit ?? "");
  const [low, setLow] = React.useState(
    lab.reference_range_low != null ? String(lab.reference_range_low) : "",
  );
  const [high, setHigh] = React.useState(
    lab.reference_range_high != null ? String(lab.reference_range_high) : "",
  );
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(value);
    if (!Number.isFinite(num)) {
      toast.error("Value must be a number.");
      return;
    }
    setSubmitting(true);
    const result = await updateLab({
      id: lab.id,
      patient_id: lab.patient_id,
      lab_name: name.trim(),
      drawn_at: date,
      value: num,
      unit: unit.trim() || null,
      reference_range_low: low.trim() ? Number(low) : null,
      reference_range_high: high.trim() ? Number(high) : null,
    });
    setSubmitting(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Lab updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit lab</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Lab</Label>
            <Combobox
              value={name}
              onChange={setName}
              suggestions={nameSuggestions}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="drawn_at">Date</Label>
              <Input
                id="drawn_at"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="text-right tabular-nums"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="low">Range low</Label>
              <Input
                id="low"
                inputMode="decimal"
                value={low}
                onChange={(e) => setLow(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="high">Range high</Label>
              <Input
                id="high"
                inputMode="decimal"
                value={high}
                onChange={(e) => setHigh(e.target.value)}
              />
            </div>
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
