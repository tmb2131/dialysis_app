import { notFound } from "next/navigation";
import { getPatient } from "@/lib/actions/patients";
import { listLabs } from "@/lib/actions/labs";
import {
  listMedications,
  listMedicationNames,
} from "@/lib/actions/medications";
import { listNotes } from "@/lib/actions/notes";
import { PatientDetail } from "./patient-detail";

export const dynamic = "force-dynamic";

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const [labs, medications, medicationNames, notes] = await Promise.all([
    listLabs(id),
    listMedications(id),
    listMedicationNames(),
    listNotes(id),
  ]);

  return (
    <PatientDetail
      patient={patient}
      labs={labs}
      medications={medications}
      medicationNameSuggestions={medicationNames}
      notes={notes}
    />
  );
}
