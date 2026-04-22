import { Suspense } from "react";
import { listPatientSummaries } from "@/lib/actions/patients";
import { PatientListClient } from "./patient-list-client";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

async function PatientList() {
  const patients = await listPatientSummaries();
  return <PatientListClient initialPatients={patients} />;
}

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl border bg-card px-5 py-4">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle,hsl(var(--foreground)/0.06)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
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
      <div className="rounded-lg border">
        <div className="space-y-3 p-3">
          <Skeleton className="h-4 w-36" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-4 w-44" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
