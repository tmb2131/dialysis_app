"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
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
import { Combobox } from "@/components/ui/combobox";
import { createPanel } from "@/lib/actions/labs";
import { formatDateISO } from "@/lib/utils";
import type { Lab } from "@/lib/types";

type Row = {
  key: string;
  lab_name: string;
  value: string;
  unit: string;
  ref_low: string;
  ref_high: string;
};

function newRow(): Row {
  return {
    key: Math.random().toString(36).slice(2),
    lab_name: "",
    value: "",
    unit: "",
    ref_low: "",
    ref_high: "",
  };
}

/**
 * Build defaults (unit + reference range) from prior entries, so after she
 * types "Potassium" the unit/range auto-fill from the last time she entered it.
 */
function buildLabDefaults(labs: Lab[]) {
  const map = new Map<
    string,
    { unit: string | null; low: number | null; high: number | null }
  >();
  const sorted = [...labs].sort((a, b) => b.drawn_at.localeCompare(a.drawn_at));
  for (const l of sorted) {
    if (!map.has(l.lab_name)) {
      map.set(l.lab_name, {
        unit: l.unit,
        low: l.reference_range_low,
        high: l.reference_range_high,
      });
    }
  }
  return map;
}

export function LabPanelForm({
  open,
  onOpenChange,
  patientId,
  nameSuggestions,
  labs,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  nameSuggestions: string[];
  labs: Lab[];
}) {
  const router = useRouter();
  const [date, setDate] = React.useState(formatDateISO(new Date()));
  const [rows, setRows] = React.useState<Row[]>([newRow()]);
  const [submitting, setSubmitting] = React.useState(false);

  const defaults = React.useMemo(() => buildLabDefaults(labs), [labs]);

  React.useEffect(() => {
    if (open) {
      setDate(formatDateISO(new Date()));
      setRows([newRow()]);
    }
  }, [open]);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function handleNameChange(key: string, name: string) {
    const def = defaults.get(name);
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const shouldFill = !r.unit && !r.ref_low && !r.ref_high;
        return {
          ...r,
          lab_name: name,
          unit: shouldFill && def?.unit ? def.unit : r.unit,
          ref_low:
            shouldFill && def?.low != null ? String(def.low) : r.ref_low,
          ref_high:
            shouldFill && def?.high != null ? String(def.high) : r.ref_high,
        };
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entries = rows
      .filter((r) => r.lab_name.trim() && r.value.trim())
      .map((r) => ({
        lab_name: r.lab_name.trim(),
        value: Number(r.value),
        unit: r.unit.trim() || null,
        reference_range_low: r.ref_low.trim() ? Number(r.ref_low) : null,
        reference_range_high: r.ref_high.trim() ? Number(r.ref_high) : null,
      }));

    if (entries.length === 0) {
      toast.error("Add at least one lab with a value.");
      return;
    }
    for (const e of entries) {
      if (!Number.isFinite(e.value)) {
        toast.error(`Invalid value for ${e.lab_name}`);
        return;
      }
    }

    setSubmitting(true);
    const result = await createPanel({
      patient_id: patientId,
      drawn_at: date,
      entries,
    });
    setSubmitting(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${entries.length} lab${entries.length === 1 ? "" : "s"} saved`);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add lab panel</DialogTitle>
          <DialogDescription>
            Enter one or more labs drawn on the same day.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="drawn_at">Drawn date</Label>
              <Input
                id="drawn_at"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="hidden sm:grid sm:grid-cols-[1.6fr_1fr_0.8fr_1.6fr_auto] sm:gap-2 sm:px-1 sm:text-xs sm:font-medium sm:uppercase sm:tracking-wide sm:text-muted-foreground">
              <div>Lab</div>
              <div className="text-right">Value</div>
              <div>Unit</div>
              <div>Range (low / high)</div>
              <div aria-hidden className="w-8" />
            </div>
            <div className="space-y-2">
              {rows.map((r, idx) => (
                <div
                  key={r.key}
                  className="grid grid-cols-1 items-start gap-2 rounded-md border bg-muted/20 p-2 sm:grid-cols-[1.6fr_1fr_0.8fr_1.6fr_auto] sm:border-0 sm:bg-transparent sm:p-0"
                >
                  <Combobox
                    value={r.lab_name}
                    onChange={(v) => handleNameChange(r.key, v)}
                    suggestions={nameSuggestions}
                    placeholder="e.g. Potassium"
                  />
                  <Input
                    inputMode="decimal"
                    step="any"
                    placeholder="Value"
                    value={r.value}
                    onChange={(e) => updateRow(r.key, { value: e.target.value })}
                    className="text-right tabular-nums"
                    autoFocus={idx === 0}
                  />
                  <Input
                    placeholder="mg/dL"
                    value={r.unit}
                    onChange={(e) => updateRow(r.key, { unit: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      inputMode="decimal"
                      placeholder="Low"
                      value={r.ref_low}
                      onChange={(e) =>
                        updateRow(r.key, { ref_low: e.target.value })
                      }
                    />
                    <Input
                      inputMode="decimal"
                      placeholder="High"
                      value={r.ref_high}
                      onChange={(e) =>
                        updateRow(r.key, { ref_high: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={rows.length === 1}
                    onClick={() =>
                      setRows((prev) => prev.filter((x) => x.key !== r.key))
                    }
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((prev) => [...prev, newRow()])}
            >
              <Plus className="h-4 w-4" />
              Add lab
            </Button>
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
              {submitting ? "Saving…" : "Save panel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
