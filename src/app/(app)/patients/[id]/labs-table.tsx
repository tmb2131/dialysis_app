"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LabPanelForm } from "./lab-panel-form";
import { LabEditForm } from "./lab-edit-form";
import { deleteLab } from "@/lib/actions/labs";
import { formatDate } from "@/lib/utils";
import type { Lab } from "@/lib/types";

export function LabsTable({
  patientId,
  labs,
  labNameSuggestions,
}: {
  patientId: string;
  labs: Lab[];
  labNameSuggestions: string[];
}) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Lab | null>(null);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Lab[]>();
    for (const l of labs) {
      const list = map.get(l.drawn_at) ?? [];
      list.push(l);
      map.set(l.drawn_at, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [labs]);

  async function handleDelete(lab: Lab) {
    if (!confirm(`Delete ${lab.lab_name} from ${formatDate(lab.drawn_at)}?`)) return;
    const result = await deleteLab(lab.id, patientId);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Lab deleted");
    router.refresh();
  }

  function flag(lab: Lab): "low" | "high" | null {
    if (lab.reference_range_low != null && lab.value < lab.reference_range_low)
      return "low";
    if (
      lab.reference_range_high != null &&
      lab.value > lab.reference_range_high
    )
      return "high";
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Labs</CardTitle>
        <Button onClick={() => setPanelOpen(true)} size="sm">
          <Plus className="h-4 w-4" />
          Add panel
        </Button>
      </CardHeader>
      <CardContent>
        {grouped.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No labs yet. Click “Add panel” to enter the first set.
          </p>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, entries]) => (
              <div key={date}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{formatDate(date)}</h3>
                  <span className="text-xs text-muted-foreground">
                    {entries.length} lab{entries.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lab</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="hidden sm:table-cell">Unit</TableHead>
                        <TableHead className="hidden md:table-cell">Range</TableHead>
                        <TableHead className="w-1"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((lab) => {
                        const f = flag(lab);
                        return (
                          <TableRow key={lab.id}>
                            <TableCell className="font-medium">
                              {lab.lab_name}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              <span className="inline-flex items-center gap-2">
                                {lab.value}
                                {f && (
                                  <Badge variant="warning">
                                    {f === "low" ? "Low" : "High"}
                                  </Badge>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="hidden text-muted-foreground sm:table-cell">
                              {lab.unit ?? "—"}
                            </TableCell>
                            <TableCell className="hidden text-muted-foreground md:table-cell">
                              {lab.reference_range_low != null ||
                              lab.reference_range_high != null
                                ? `${lab.reference_range_low ?? "—"} – ${
                                    lab.reference_range_high ?? "—"
                                  }`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditing(lab)}
                                  aria-label="Edit lab"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(lab)}
                                  aria-label="Delete lab"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <LabPanelForm
        patientId={patientId}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        nameSuggestions={labNameSuggestions}
        labs={labs}
      />

      {editing && (
        <LabEditForm
          lab={editing}
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
          nameSuggestions={labNameSuggestions}
        />
      )}
    </Card>
  );
}
