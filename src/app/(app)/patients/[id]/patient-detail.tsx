"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientForm } from "@/components/patient-form";
import { LabsChart } from "./labs-chart";
import { LabsTable } from "./labs-table";
import { MedicationsSection } from "./medications-section";
import { calculateAge, formatDate } from "@/lib/utils";
import type { Lab, Medication, Patient } from "@/lib/types";

export function PatientDetail({
  patient,
  labs,
  medications,
  medicationNameSuggestions,
}: {
  patient: Patient;
  labs: Lab[];
  medications: Medication[];
  medicationNameSuggestions: string[];
}) {
  const [editOpen, setEditOpen] = React.useState(false);

  const labNameSuggestions = React.useMemo(() => {
    const names = Array.from(new Set(labs.map((l) => l.lab_name)));
    return names.sort();
  }, [labs]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All patients
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {patient.last_name}, {patient.first_name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>MRN {patient.mrn}</span>
              <span className="text-muted-foreground/60">·</span>
              <span>{formatDate(patient.date_of_birth)}</span>
              <span className="text-muted-foreground/60">·</span>
              <span>Age {calculateAge(patient.date_of_birth)}</span>
            </div>
            {patient.notes && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {patient.notes}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <LabsChart
        labs={labs}
        medications={medications}
        patientId={patient.id}
        labNameSuggestions={labNameSuggestions}
        medicationNameSuggestions={medicationNameSuggestions}
      />

      <LabsTable
        patientId={patient.id}
        labs={labs}
        labNameSuggestions={labNameSuggestions}
      />

      <MedicationsSection
        patientId={patient.id}
        medications={medications}
        nameSuggestions={medicationNameSuggestions}
      />

      <PatientForm open={editOpen} onOpenChange={setEditOpen} patient={patient} />
    </div>
  );
}
