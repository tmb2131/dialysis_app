"use client";

import * as React from "react";
import { Pencil, Pill, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicationForm } from "./medication-form";
import { deleteMedication } from "@/lib/actions/medications";
import { formatDate } from "@/lib/utils";
import type { Medication } from "@/lib/types";

export function MedicationsSection({
  patientId,
  medications,
  nameSuggestions,
}: {
  patientId: string;
  medications: Medication[];
  nameSuggestions: string[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Medication | null>(null);

  const { active, past } = React.useMemo(() => {
    const active: Medication[] = [];
    const past: Medication[] = [];
    for (const m of medications) {
      (m.end_date ? past : active).push(m);
    }
    active.sort((a, b) => b.start_date.localeCompare(a.start_date));
    past.sort((a, b) =>
      (b.end_date ?? b.start_date).localeCompare(a.end_date ?? a.start_date),
    );
    return { active, past };
  }, [medications]);

  async function handleDelete(m: Medication) {
    if (!confirm(`Delete ${m.name}? This cannot be undone.`)) return;
    const result = await deleteMedication(m.id, patientId);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Medication deleted");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Medications</CardTitle>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add medication
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Active{" "}
            <span className="text-muted-foreground">({active.length})</span>
          </h3>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active medications.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {active.map((m) => (
                <MedRow
                  key={m.id}
                  med={m}
                  onEdit={() => setEditing(m)}
                  onDelete={() => handleDelete(m)}
                />
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Past <span className="text-muted-foreground">({past.length})</span>
          </h3>
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past medications.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {past.map((m) => (
                <MedRow
                  key={m.id}
                  med={m}
                  onEdit={() => setEditing(m)}
                  onDelete={() => handleDelete(m)}
                  past
                />
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <MedicationForm
        mode="create"
        patientId={patientId}
        open={addOpen}
        onOpenChange={setAddOpen}
        nameSuggestions={nameSuggestions}
      />

      {editing && (
        <MedicationForm
          mode="edit"
          patientId={patientId}
          medication={editing}
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
          nameSuggestions={nameSuggestions}
        />
      )}
    </Card>
  );
}

function MedRow({
  med,
  past,
  onEdit,
  onDelete,
}: {
  med: Medication;
  past?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-md p-2 ${
            past ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          }`}
        >
          <Pill className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{med.name}</span>
            {med.dose != null && (
              <span className="text-sm text-muted-foreground">
                {med.dose}
                {med.unit ? ` ${med.unit}` : ""}
              </span>
            )}
            {med.frequency && (
              <span className="text-sm text-muted-foreground">
                · {med.frequency}
              </span>
            )}
            {past && <Badge variant="secondary">Ended</Badge>}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(med.start_date)}
            {" → "}
            {med.end_date ? formatDate(med.end_date) : "present"}
          </div>
          {med.notes && (
            <p className="mt-1 text-sm text-muted-foreground">{med.notes}</p>
          )}
        </div>
      </div>
      <div className="flex gap-1 sm:shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
