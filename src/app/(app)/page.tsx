import { Suspense } from "react";
import { listPatients } from "@/lib/actions/patients";
import { PatientListClient } from "./patient-list-client";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

async function PatientList() {
  const patients = await listPatients();
  return <PatientListClient initialPatients={patients} />;
}

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
        <p className="text-sm text-muted-foreground">
          Search, add, and open a patient to review labs and medications.
        </p>
      </div>
      <Suspense fallback={<PatientListSkeleton />}>
        <PatientList />
      </Suspense>
    </div>
  );
}

function PatientListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
