"use client";

import * as React from "react";
import Link from "next/link";
import { FlaskConical, NotebookPen, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { PatientForm } from "@/components/patient-form";
import { calculateAge, formatDate, formatRelativeDays } from "@/lib/utils";
import type { PatientSummary } from "@/lib/actions/patients";

export function PatientListClient({
  initialPatients,
}: {
  initialPatients: PatientSummary[];
}) {
  const [search, setSearch] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const shouldAnimate = search.trim() === "";

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialPatients;
    return initialPatients.filter((p) => {
      return (
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q)
      );
    });
  }, [search, initialPatients]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or MRN"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add patient
        </Button>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">MRN</TableHead>
              <TableHead className="hidden md:table-cell">Activity</TableHead>
              <TableHead className="hidden sm:table-cell">DOB</TableHead>
              <TableHead className="hidden md:table-cell">Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {initialPatients.length === 0
                    ? "No patients yet. Click “Add patient” to get started."
                    : "No matches."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p, index) => (
                <TableRow
                  key={p.id}
                  className={shouldAnimate ? "cursor-pointer row-fade-in" : "cursor-pointer"}
                  style={
                    shouldAnimate
                      ? { animationDelay: `${Math.min(index, 8) * 35}ms` }
                      : undefined
                  }
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/patients/${p.id}`}
                      className="block w-full"
                    >
                      <div className="flex items-center gap-2">
                        <span>{p.last_name}, {p.first_name}</span>
                        {p.flag_count > 0 ? (
                          <span
                            className={[
                              "inline-block h-2.5 w-2.5 rounded-full",
                              p.flag_count >= 3 ? "bg-destructive animate-pulse" : "bg-amber-500",
                            ].join(" ")}
                            title={`${
                              p.flag_count
                            } out-of-range value${p.flag_count === 1 ? "" : "s"} in latest panel${
                              p.latest_panel_at ? ` (${formatDate(p.latest_panel_at)})` : ""
                            }: ${p.flagged_labs.join(", ")}`}
                            aria-label={`${p.flag_count} out-of-range labs`}
                          />
                        ) : null}
                      </div>
                      <div className="text-xs font-normal text-muted-foreground md:hidden">
                        MRN {p.mrn} · {formatDate(p.date_of_birth)}
                        {renderActivityText(p.latest_panel_at, p.latest_note_at) ? (
                          <>
                            {" · "}
                            {renderActivityText(p.latest_panel_at, p.latest_note_at)}
                          </>
                        ) : null}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Link href={`/patients/${p.id}`} className="block">
                      {p.mrn}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    <Link href={`/patients/${p.id}`} className="block">
                      <ActivityCell
                        latestPanelAt={p.latest_panel_at}
                        latestNoteAt={p.latest_note_at}
                      />
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Link href={`/patients/${p.id}`} className="block">
                      {formatDate(p.date_of_birth)}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Link href={`/patients/${p.id}`} className="block">
                      {calculateAge(p.date_of_birth)}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      <PatientForm open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function ActivityCell({
  latestPanelAt,
  latestNoteAt,
}: {
  latestPanelAt: string | null;
  latestNoteAt: string | null;
}) {
  const activityDate = pickLatest(latestPanelAt, latestNoteAt);
  if (!activityDate) return <span>—</span>;
  const source = activityDate === latestPanelAt ? "lab" : "note";

  return (
    <span className="inline-flex items-center gap-1.5">
      {source === "lab" ? <FlaskConical className="h-3.5 w-3.5" /> : <NotebookPen className="h-3.5 w-3.5" />}
      {formatRelativeDays(activityDate)}
    </span>
  );
}

function renderActivityText(latestPanelAt: string | null, latestNoteAt: string | null) {
  const activityDate = pickLatest(latestPanelAt, latestNoteAt);
  if (!activityDate) return null;
  return formatRelativeDays(activityDate);
}

function pickLatest(panelAt: string | null, noteAt: string | null) {
  if (!panelAt) return noteAt;
  if (!noteAt) return panelAt;
  return panelAt >= noteAt ? panelAt : noteAt;
}
