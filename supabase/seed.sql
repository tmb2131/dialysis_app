-- Seed data for dialysis tracker
-- Safe to run repeatedly: it wipes the three seed patients and reinserts them.

begin;

delete from public.patients
    where mrn in ('MRN-10001', 'MRN-10002', 'MRN-10003');

-- =================== Patients ===================

insert into public.patients (id, first_name, last_name, mrn, date_of_birth, notes) values
    ('11111111-1111-1111-1111-111111111111',
        'Eleanor', 'Hayes', 'MRN-10001', '1952-03-14',
        'CKD stage 5, HD 3x weekly (Mon/Wed/Fri). Vascular access: AV fistula left upper arm.'),
    ('22222222-2222-2222-2222-222222222222',
        'Marcus', 'Okafor', 'MRN-10002', '1968-11-02',
        'Diabetic nephropathy, HD 3x weekly. Persistent hyperphosphatemia — trialing sevelamer.'),
    ('33333333-3333-3333-3333-333333333333',
        'Priya', 'Shah', 'MRN-10003', '1975-07-21',
        'Polycystic kidney disease, HD 3x weekly. Secondary hyperparathyroidism.');

-- =================== Helpers ===================
-- Each lab panel is a weekly draw. The "offset_days" column spaces panels
-- roughly every 2 weeks across ~6 months (the newest panel is the most recent).

-- =================== Eleanor Hayes (patient 1) ===================
-- Story: Iron deficiency anemia; IV iron started mid-timeline → hemoglobin rises.

insert into public.labs (patient_id, drawn_at, lab_name, value, unit, reference_range_low, reference_range_high)
select
    '11111111-1111-1111-1111-111111111111', drawn, name, value, unit, low, high
from (values
    -- 12 bi-weekly panels over ~6 months ending 2026-04-10
    (date '2025-10-24', 'Hemoglobin',  9.2, 'g/dL',  11.0, 12.0),
    (date '2025-10-24', 'Potassium',   4.8, 'mEq/L',  3.5,  5.0),
    (date '2025-10-24', 'Phosphorus',  5.2, 'mg/dL',  3.5,  5.5),
    (date '2025-10-24', 'Calcium',     8.9, 'mg/dL',  8.4, 10.2),
    (date '2025-10-24', 'PTH',       420,   'pg/mL', 150,  300),
    (date '2025-10-24', 'Creatinine', 8.4, 'mg/dL',   0.6,  1.2),

    (date '2025-11-07', 'Hemoglobin',  9.0, 'g/dL',  11.0, 12.0),
    (date '2025-11-07', 'Potassium',   5.0, 'mEq/L',  3.5,  5.0),
    (date '2025-11-07', 'Phosphorus',  5.4, 'mg/dL',  3.5,  5.5),
    (date '2025-11-07', 'Calcium',     8.8, 'mg/dL',  8.4, 10.2),
    (date '2025-11-07', 'PTH',       450,   'pg/mL', 150,  300),
    (date '2025-11-07', 'Creatinine', 8.6, 'mg/dL',   0.6,  1.2),

    (date '2025-11-21', 'Hemoglobin',  8.8, 'g/dL',  11.0, 12.0),
    (date '2025-11-21', 'Potassium',   4.9, 'mEq/L',  3.5,  5.0),
    (date '2025-11-21', 'Phosphorus',  5.3, 'mg/dL',  3.5,  5.5),
    (date '2025-11-21', 'Calcium',     8.7, 'mg/dL',  8.4, 10.2),
    (date '2025-11-21', 'PTH',       470,   'pg/mL', 150,  300),
    (date '2025-11-21', 'Creatinine', 8.5, 'mg/dL',   0.6,  1.2),

    -- IV iron initiated 2025-12-01
    (date '2025-12-05', 'Hemoglobin',  9.0, 'g/dL',  11.0, 12.0),
    (date '2025-12-05', 'Potassium',   4.7, 'mEq/L',  3.5,  5.0),
    (date '2025-12-05', 'Phosphorus',  5.2, 'mg/dL',  3.5,  5.5),
    (date '2025-12-05', 'Calcium',     8.8, 'mg/dL',  8.4, 10.2),
    (date '2025-12-05', 'PTH',       460,   'pg/mL', 150,  300),
    (date '2025-12-05', 'Creatinine', 8.4, 'mg/dL',   0.6,  1.2),

    (date '2025-12-19', 'Hemoglobin',  9.6, 'g/dL',  11.0, 12.0),
    (date '2025-12-19', 'Potassium',   4.6, 'mEq/L',  3.5,  5.0),
    (date '2025-12-19', 'Phosphorus',  5.1, 'mg/dL',  3.5,  5.5),
    (date '2025-12-19', 'Calcium',     8.9, 'mg/dL',  8.4, 10.2),
    (date '2025-12-19', 'PTH',       445,   'pg/mL', 150,  300),
    (date '2025-12-19', 'Creatinine', 8.5, 'mg/dL',   0.6,  1.2),

    (date '2026-01-02', 'Hemoglobin', 10.2, 'g/dL',  11.0, 12.0),
    (date '2026-01-02', 'Potassium',   4.8, 'mEq/L',  3.5,  5.0),
    (date '2026-01-02', 'Phosphorus',  5.0, 'mg/dL',  3.5,  5.5),
    (date '2026-01-02', 'Calcium',     8.8, 'mg/dL',  8.4, 10.2),
    (date '2026-01-02', 'PTH',       420,   'pg/mL', 150,  300),
    (date '2026-01-02', 'Creatinine', 8.6, 'mg/dL',   0.6,  1.2),

    (date '2026-01-16', 'Hemoglobin', 10.6, 'g/dL',  11.0, 12.0),
    (date '2026-01-16', 'Potassium',   4.7, 'mEq/L',  3.5,  5.0),
    (date '2026-01-16', 'Phosphorus',  5.1, 'mg/dL',  3.5,  5.5),
    (date '2026-01-16', 'Calcium',     8.7, 'mg/dL',  8.4, 10.2),
    (date '2026-01-16', 'PTH',       410,   'pg/mL', 150,  300),
    (date '2026-01-16', 'Creatinine', 8.5, 'mg/dL',   0.6,  1.2),

    (date '2026-01-30', 'Hemoglobin', 11.0, 'g/dL',  11.0, 12.0),
    (date '2026-01-30', 'Potassium',   4.6, 'mEq/L',  3.5,  5.0),
    (date '2026-01-30', 'Phosphorus',  5.0, 'mg/dL',  3.5,  5.5),
    (date '2026-01-30', 'Calcium',     8.8, 'mg/dL',  8.4, 10.2),
    (date '2026-01-30', 'PTH',       400,   'pg/mL', 150,  300),
    (date '2026-01-30', 'Creatinine', 8.7, 'mg/dL',   0.6,  1.2),

    (date '2026-02-13', 'Hemoglobin', 11.3, 'g/dL',  11.0, 12.0),
    (date '2026-02-13', 'Potassium',   4.5, 'mEq/L',  3.5,  5.0),
    (date '2026-02-13', 'Phosphorus',  4.9, 'mg/dL',  3.5,  5.5),
    (date '2026-02-13', 'Calcium',     8.9, 'mg/dL',  8.4, 10.2),
    (date '2026-02-13', 'PTH',       385,   'pg/mL', 150,  300),
    (date '2026-02-13', 'Creatinine', 8.5, 'mg/dL',   0.6,  1.2),

    (date '2026-02-27', 'Hemoglobin', 11.5, 'g/dL',  11.0, 12.0),
    (date '2026-02-27', 'Potassium',   4.6, 'mEq/L',  3.5,  5.0),
    (date '2026-02-27', 'Phosphorus',  4.8, 'mg/dL',  3.5,  5.5),
    (date '2026-02-27', 'Calcium',     8.8, 'mg/dL',  8.4, 10.2),
    (date '2026-02-27', 'PTH',       370,   'pg/mL', 150,  300),
    (date '2026-02-27', 'Creatinine', 8.6, 'mg/dL',   0.6,  1.2),

    (date '2026-03-13', 'Hemoglobin', 11.4, 'g/dL',  11.0, 12.0),
    (date '2026-03-13', 'Potassium',   4.5, 'mEq/L',  3.5,  5.0),
    (date '2026-03-13', 'Phosphorus',  4.8, 'mg/dL',  3.5,  5.5),
    (date '2026-03-13', 'Calcium',     8.9, 'mg/dL',  8.4, 10.2),
    (date '2026-03-13', 'PTH',       365,   'pg/mL', 150,  300),
    (date '2026-03-13', 'Creatinine', 8.7, 'mg/dL',   0.6,  1.2),

    (date '2026-04-10', 'Hemoglobin', 11.6, 'g/dL',  11.0, 12.0),
    (date '2026-04-10', 'Potassium',   4.6, 'mEq/L',  3.5,  5.0),
    (date '2026-04-10', 'Phosphorus',  4.9, 'mg/dL',  3.5,  5.5),
    (date '2026-04-10', 'Calcium',     8.8, 'mg/dL',  8.4, 10.2),
    (date '2026-04-10', 'PTH',       360,   'pg/mL', 150,  300),
    (date '2026-04-10', 'Creatinine', 8.6, 'mg/dL',   0.6,  1.2)
) as v(drawn, name, value, unit, low, high);

insert into public.medications
    (patient_id, name, dose, unit, frequency, start_date, end_date, notes)
values
    ('11111111-1111-1111-1111-111111111111',
        'Epoetin alfa', 4000, 'units', '3x weekly with HD',
        '2025-10-01', null,
        'Baseline ESA therapy for CKD-associated anemia.'),
    ('11111111-1111-1111-1111-111111111111',
        'Iron sucrose', 100, 'mg', '1x weekly with HD',
        '2025-12-01', null,
        'Started due to persistent anemia and low transferrin saturation.'),
    ('11111111-1111-1111-1111-111111111111',
        'Calcium acetate', 667, 'mg', 'with meals',
        '2025-09-15', null,
        'Phosphate binder.');

-- =================== Marcus Okafor (patient 2) ===================
-- Story: hyperphosphatemia. Started calcium acetate, ineffective — switched
-- to sevelamer mid-timeline → phosphorus falls into range.

insert into public.labs (patient_id, drawn_at, lab_name, value, unit, reference_range_low, reference_range_high)
select
    '22222222-2222-2222-2222-222222222222', drawn, name, value, unit, low, high
from (values
    (date '2025-10-20', 'Phosphorus',  7.2, 'mg/dL',  3.5,  5.5),
    (date '2025-10-20', 'Calcium',     9.0, 'mg/dL',  8.4, 10.2),
    (date '2025-10-20', 'Potassium',   5.1, 'mEq/L',  3.5,  5.0),
    (date '2025-10-20', 'Hemoglobin', 10.8, 'g/dL',  11.0, 12.0),
    (date '2025-10-20', 'PTH',       310,   'pg/mL', 150,  300),
    (date '2025-10-20', 'Creatinine', 9.4, 'mg/dL',   0.6,  1.2),

    (date '2025-11-03', 'Phosphorus',  7.0, 'mg/dL',  3.5,  5.5),
    (date '2025-11-03', 'Calcium',     9.2, 'mg/dL',  8.4, 10.2),
    (date '2025-11-03', 'Potassium',   5.2, 'mEq/L',  3.5,  5.0),
    (date '2025-11-03', 'Hemoglobin', 10.9, 'g/dL',  11.0, 12.0),
    (date '2025-11-03', 'PTH',       320,   'pg/mL', 150,  300),
    (date '2025-11-03', 'Creatinine', 9.6, 'mg/dL',   0.6,  1.2),

    (date '2025-11-17', 'Phosphorus',  6.9, 'mg/dL',  3.5,  5.5),
    (date '2025-11-17', 'Calcium',     9.4, 'mg/dL',  8.4, 10.2),
    (date '2025-11-17', 'Potassium',   5.0, 'mEq/L',  3.5,  5.0),
    (date '2025-11-17', 'Hemoglobin', 11.0, 'g/dL',  11.0, 12.0),
    (date '2025-11-17', 'PTH',       325,   'pg/mL', 150,  300),
    (date '2025-11-17', 'Creatinine', 9.5, 'mg/dL',   0.6,  1.2),

    -- Switched calcium acetate -> sevelamer on 2025-12-01
    (date '2025-12-01', 'Phosphorus',  7.1, 'mg/dL',  3.5,  5.5),
    (date '2025-12-01', 'Calcium',    10.0, 'mg/dL',  8.4, 10.2),
    (date '2025-12-01', 'Potassium',   5.1, 'mEq/L',  3.5,  5.0),
    (date '2025-12-01', 'Hemoglobin', 11.1, 'g/dL',  11.0, 12.0),
    (date '2025-12-01', 'PTH',       330,   'pg/mL', 150,  300),
    (date '2025-12-01', 'Creatinine', 9.6, 'mg/dL',   0.6,  1.2),

    (date '2025-12-15', 'Phosphorus',  6.6, 'mg/dL',  3.5,  5.5),
    (date '2025-12-15', 'Calcium',     9.6, 'mg/dL',  8.4, 10.2),
    (date '2025-12-15', 'Potassium',   5.0, 'mEq/L',  3.5,  5.0),
    (date '2025-12-15', 'Hemoglobin', 11.0, 'g/dL',  11.0, 12.0),
    (date '2025-12-15', 'PTH',       305,   'pg/mL', 150,  300),
    (date '2025-12-15', 'Creatinine', 9.4, 'mg/dL',   0.6,  1.2),

    (date '2025-12-29', 'Phosphorus',  6.0, 'mg/dL',  3.5,  5.5),
    (date '2025-12-29', 'Calcium',     9.3, 'mg/dL',  8.4, 10.2),
    (date '2025-12-29', 'Potassium',   4.8, 'mEq/L',  3.5,  5.0),
    (date '2025-12-29', 'Hemoglobin', 11.2, 'g/dL',  11.0, 12.0),
    (date '2025-12-29', 'PTH',       295,   'pg/mL', 150,  300),
    (date '2025-12-29', 'Creatinine', 9.5, 'mg/dL',   0.6,  1.2),

    (date '2026-01-12', 'Phosphorus',  5.6, 'mg/dL',  3.5,  5.5),
    (date '2026-01-12', 'Calcium',     9.2, 'mg/dL',  8.4, 10.2),
    (date '2026-01-12', 'Potassium',   4.9, 'mEq/L',  3.5,  5.0),
    (date '2026-01-12', 'Hemoglobin', 11.1, 'g/dL',  11.0, 12.0),
    (date '2026-01-12', 'PTH',       290,   'pg/mL', 150,  300),
    (date '2026-01-12', 'Creatinine', 9.4, 'mg/dL',   0.6,  1.2),

    (date '2026-01-26', 'Phosphorus',  5.3, 'mg/dL',  3.5,  5.5),
    (date '2026-01-26', 'Calcium',     9.1, 'mg/dL',  8.4, 10.2),
    (date '2026-01-26', 'Potassium',   4.8, 'mEq/L',  3.5,  5.0),
    (date '2026-01-26', 'Hemoglobin', 11.3, 'g/dL',  11.0, 12.0),
    (date '2026-01-26', 'PTH',       275,   'pg/mL', 150,  300),
    (date '2026-01-26', 'Creatinine', 9.6, 'mg/dL',   0.6,  1.2),

    (date '2026-02-09', 'Phosphorus',  5.2, 'mg/dL',  3.5,  5.5),
    (date '2026-02-09', 'Calcium',     9.0, 'mg/dL',  8.4, 10.2),
    (date '2026-02-09', 'Potassium',   4.7, 'mEq/L',  3.5,  5.0),
    (date '2026-02-09', 'Hemoglobin', 11.4, 'g/dL',  11.0, 12.0),
    (date '2026-02-09', 'PTH',       270,   'pg/mL', 150,  300),
    (date '2026-02-09', 'Creatinine', 9.5, 'mg/dL',   0.6,  1.2),

    (date '2026-02-23', 'Phosphorus',  4.9, 'mg/dL',  3.5,  5.5),
    (date '2026-02-23', 'Calcium',     9.1, 'mg/dL',  8.4, 10.2),
    (date '2026-02-23', 'Potassium',   4.6, 'mEq/L',  3.5,  5.0),
    (date '2026-02-23', 'Hemoglobin', 11.5, 'g/dL',  11.0, 12.0),
    (date '2026-02-23', 'PTH',       265,   'pg/mL', 150,  300),
    (date '2026-02-23', 'Creatinine', 9.6, 'mg/dL',   0.6,  1.2),

    (date '2026-03-16', 'Phosphorus',  5.0, 'mg/dL',  3.5,  5.5),
    (date '2026-03-16', 'Calcium',     9.0, 'mg/dL',  8.4, 10.2),
    (date '2026-03-16', 'Potassium',   4.8, 'mEq/L',  3.5,  5.0),
    (date '2026-03-16', 'Hemoglobin', 11.4, 'g/dL',  11.0, 12.0),
    (date '2026-03-16', 'PTH',       260,   'pg/mL', 150,  300),
    (date '2026-03-16', 'Creatinine', 9.7, 'mg/dL',   0.6,  1.2),

    (date '2026-04-13', 'Phosphorus',  4.8, 'mg/dL',  3.5,  5.5),
    (date '2026-04-13', 'Calcium',     9.1, 'mg/dL',  8.4, 10.2),
    (date '2026-04-13', 'Potassium',   4.7, 'mEq/L',  3.5,  5.0),
    (date '2026-04-13', 'Hemoglobin', 11.5, 'g/dL',  11.0, 12.0),
    (date '2026-04-13', 'PTH',       255,   'pg/mL', 150,  300),
    (date '2026-04-13', 'Creatinine', 9.5, 'mg/dL',   0.6,  1.2)
) as v(drawn, name, value, unit, low, high);

insert into public.medications
    (patient_id, name, dose, unit, frequency, start_date, end_date, notes)
values
    ('22222222-2222-2222-2222-222222222222',
        'Calcium acetate', 667, 'mg', 'with meals',
        '2025-09-01', '2025-11-30',
        'Initial phosphate binder; discontinued due to rising calcium and ineffective phosphorus control.'),
    ('22222222-2222-2222-2222-222222222222',
        'Sevelamer carbonate', 800, 'mg', 'with meals',
        '2025-12-01', null,
        'Switched from calcium acetate — phosphorus 7.1, calcium trending high. Non-calcium binder preferred.'),
    ('22222222-2222-2222-2222-222222222222',
        'Epoetin alfa', 3000, 'units', '3x weekly with HD',
        '2025-09-01', null,
        'Maintenance ESA therapy.');

-- =================== Priya Shah (patient 3) ===================
-- Story: secondary hyperparathyroidism. Cinacalcet started mid-timeline →
-- PTH comes down.

insert into public.labs (patient_id, drawn_at, lab_name, value, unit, reference_range_low, reference_range_high)
select
    '33333333-3333-3333-3333-333333333333', drawn, name, value, unit, low, high
from (values
    (date '2025-10-22', 'PTH',       640,   'pg/mL', 150,  300),
    (date '2025-10-22', 'Calcium',    10.2, 'mg/dL',  8.4, 10.2),
    (date '2025-10-22', 'Phosphorus',  5.8, 'mg/dL',  3.5,  5.5),
    (date '2025-10-22', 'Potassium',   4.9, 'mEq/L',  3.5,  5.0),
    (date '2025-10-22', 'Hemoglobin', 11.8, 'g/dL',  11.0, 12.0),
    (date '2025-10-22', 'Creatinine', 7.9, 'mg/dL',   0.6,  1.2),

    (date '2025-11-05', 'PTH',       660,   'pg/mL', 150,  300),
    (date '2025-11-05', 'Calcium',    10.3, 'mg/dL',  8.4, 10.2),
    (date '2025-11-05', 'Phosphorus',  5.6, 'mg/dL',  3.5,  5.5),
    (date '2025-11-05', 'Potassium',   4.8, 'mEq/L',  3.5,  5.0),
    (date '2025-11-05', 'Hemoglobin', 11.7, 'g/dL',  11.0, 12.0),
    (date '2025-11-05', 'Creatinine', 7.8, 'mg/dL',   0.6,  1.2),

    (date '2025-11-19', 'PTH',       680,   'pg/mL', 150,  300),
    (date '2025-11-19', 'Calcium',    10.3, 'mg/dL',  8.4, 10.2),
    (date '2025-11-19', 'Phosphorus',  5.7, 'mg/dL',  3.5,  5.5),
    (date '2025-11-19', 'Potassium',   4.9, 'mEq/L',  3.5,  5.0),
    (date '2025-11-19', 'Hemoglobin', 11.8, 'g/dL',  11.0, 12.0),
    (date '2025-11-19', 'Creatinine', 7.9, 'mg/dL',   0.6,  1.2),

    -- Cinacalcet started 2025-12-03
    (date '2025-12-03', 'PTH',       650,   'pg/mL', 150,  300),
    (date '2025-12-03', 'Calcium',    10.2, 'mg/dL',  8.4, 10.2),
    (date '2025-12-03', 'Phosphorus',  5.6, 'mg/dL',  3.5,  5.5),
    (date '2025-12-03', 'Potassium',   4.8, 'mEq/L',  3.5,  5.0),
    (date '2025-12-03', 'Hemoglobin', 11.9, 'g/dL',  11.0, 12.0),
    (date '2025-12-03', 'Creatinine', 7.7, 'mg/dL',   0.6,  1.2),

    (date '2025-12-17', 'PTH',       560,   'pg/mL', 150,  300),
    (date '2025-12-17', 'Calcium',     9.9, 'mg/dL',  8.4, 10.2),
    (date '2025-12-17', 'Phosphorus',  5.4, 'mg/dL',  3.5,  5.5),
    (date '2025-12-17', 'Potassium',   4.7, 'mEq/L',  3.5,  5.0),
    (date '2025-12-17', 'Hemoglobin', 11.8, 'g/dL',  11.0, 12.0),
    (date '2025-12-17', 'Creatinine', 7.8, 'mg/dL',   0.6,  1.2),

    -- Cinacalcet dose increased 2026-01-05
    (date '2026-01-07', 'PTH',       480,   'pg/mL', 150,  300),
    (date '2026-01-07', 'Calcium',     9.6, 'mg/dL',  8.4, 10.2),
    (date '2026-01-07', 'Phosphorus',  5.3, 'mg/dL',  3.5,  5.5),
    (date '2026-01-07', 'Potassium',   4.8, 'mEq/L',  3.5,  5.0),
    (date '2026-01-07', 'Hemoglobin', 11.7, 'g/dL',  11.0, 12.0),
    (date '2026-01-07', 'Creatinine', 7.9, 'mg/dL',   0.6,  1.2),

    (date '2026-01-21', 'PTH',       410,   'pg/mL', 150,  300),
    (date '2026-01-21', 'Calcium',     9.4, 'mg/dL',  8.4, 10.2),
    (date '2026-01-21', 'Phosphorus',  5.2, 'mg/dL',  3.5,  5.5),
    (date '2026-01-21', 'Potassium',   4.7, 'mEq/L',  3.5,  5.0),
    (date '2026-01-21', 'Hemoglobin', 11.9, 'g/dL',  11.0, 12.0),
    (date '2026-01-21', 'Creatinine', 7.8, 'mg/dL',   0.6,  1.2),

    (date '2026-02-04', 'PTH',       370,   'pg/mL', 150,  300),
    (date '2026-02-04', 'Calcium',     9.3, 'mg/dL',  8.4, 10.2),
    (date '2026-02-04', 'Phosphorus',  5.1, 'mg/dL',  3.5,  5.5),
    (date '2026-02-04', 'Potassium',   4.6, 'mEq/L',  3.5,  5.0),
    (date '2026-02-04', 'Hemoglobin', 11.8, 'g/dL',  11.0, 12.0),
    (date '2026-02-04', 'Creatinine', 7.9, 'mg/dL',   0.6,  1.2),

    (date '2026-02-18', 'PTH',       330,   'pg/mL', 150,  300),
    (date '2026-02-18', 'Calcium',     9.2, 'mg/dL',  8.4, 10.2),
    (date '2026-02-18', 'Phosphorus',  5.0, 'mg/dL',  3.5,  5.5),
    (date '2026-02-18', 'Potassium',   4.7, 'mEq/L',  3.5,  5.0),
    (date '2026-02-18', 'Hemoglobin', 11.7, 'g/dL',  11.0, 12.0),
    (date '2026-02-18', 'Creatinine', 8.0, 'mg/dL',   0.6,  1.2),

    (date '2026-03-04', 'PTH',       305,   'pg/mL', 150,  300),
    (date '2026-03-04', 'Calcium',     9.1, 'mg/dL',  8.4, 10.2),
    (date '2026-03-04', 'Phosphorus',  5.0, 'mg/dL',  3.5,  5.5),
    (date '2026-03-04', 'Potassium',   4.6, 'mEq/L',  3.5,  5.0),
    (date '2026-03-04', 'Hemoglobin', 11.9, 'g/dL',  11.0, 12.0),
    (date '2026-03-04', 'Creatinine', 7.9, 'mg/dL',   0.6,  1.2),

    (date '2026-03-25', 'PTH',       285,   'pg/mL', 150,  300),
    (date '2026-03-25', 'Calcium',     9.0, 'mg/dL',  8.4, 10.2),
    (date '2026-03-25', 'Phosphorus',  4.9, 'mg/dL',  3.5,  5.5),
    (date '2026-03-25', 'Potassium',   4.7, 'mEq/L',  3.5,  5.0),
    (date '2026-03-25', 'Hemoglobin', 11.8, 'g/dL',  11.0, 12.0),
    (date '2026-03-25', 'Creatinine', 8.0, 'mg/dL',   0.6,  1.2),

    (date '2026-04-08', 'PTH',       270,   'pg/mL', 150,  300),
    (date '2026-04-08', 'Calcium',     9.0, 'mg/dL',  8.4, 10.2),
    (date '2026-04-08', 'Phosphorus',  4.8, 'mg/dL',  3.5,  5.5),
    (date '2026-04-08', 'Potassium',   4.6, 'mEq/L',  3.5,  5.0),
    (date '2026-04-08', 'Hemoglobin', 11.9, 'g/dL',  11.0, 12.0),
    (date '2026-04-08', 'Creatinine', 7.9, 'mg/dL',   0.6,  1.2)
) as v(drawn, name, value, unit, low, high);

insert into public.medications
    (patient_id, name, dose, unit, frequency, start_date, end_date, notes)
values
    ('33333333-3333-3333-3333-333333333333',
        'Sevelamer carbonate', 800, 'mg', 'with meals',
        '2025-08-15', null,
        'Phosphate binder.'),
    ('33333333-3333-3333-3333-333333333333',
        'Cinacalcet', 30, 'mg', 'daily',
        '2025-12-03', '2026-01-04',
        'Started for persistent secondary hyperparathyroidism (PTH > 600). Initial dose.'),
    ('33333333-3333-3333-3333-333333333333',
        'Cinacalcet', 60, 'mg', 'daily',
        '2026-01-05', null,
        'Dose increased — PTH still elevated at 480.');

commit;
