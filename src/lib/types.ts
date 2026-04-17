export type Patient = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  mrn: string;
  date_of_birth: string;
  notes: string | null;
};

export type Lab = {
  id: string;
  created_at: string;
  patient_id: string;
  drawn_at: string;
  lab_name: string;
  value: number;
  unit: string | null;
  reference_range_low: number | null;
  reference_range_high: number | null;
};

export type Medication = {
  id: string;
  created_at: string;
  patient_id: string;
  name: string;
  dose: number | null;
  unit: string | null;
  frequency: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
};

export type ClinicalNote = {
  id: string;
  created_at: string;
  patient_id: string;
  note_date: string;
  content: string;
};
