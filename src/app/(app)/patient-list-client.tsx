"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
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
import { calculateAge, formatDate } from "@/lib/utils";
import type { Patient } from "@/lib/types";

export function PatientListClient({
  initialPatients,
}: {
  initialPatients: Patient[];
}) {
  const [search, setSearch] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);

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
              <TableHead className="hidden sm:table-cell">DOB</TableHead>
              <TableHead className="hidden md:table-cell">Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  {initialPatients.length === 0
                    ? "No patients yet. Click “Add patient” to get started."
                    : "No matches."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link
                      href={`/patients/${p.id}`}
                      className="block w-full hover:underline"
                    >
                      {p.last_name}, {p.first_name}
                      <div className="text-xs font-normal text-muted-foreground md:hidden">
                        MRN {p.mrn} · {formatDate(p.date_of_birth)}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Link href={`/patients/${p.id}`} className="block">
                      {p.mrn}
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
