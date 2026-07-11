import type { Patient } from "../types";
import { createSupabaseRecordService } from "./supabaseRecordService";

export const patientService = createSupabaseRecordService<Patient>({
  table: "patients",
  select: "payload",
  orderColumn: "created_at",
  ascending: true,
  toRow: (patient) => ({
    id: patient.id,
    patient_code: patient.patientCode,
    care_path: patient.carePath,
    assigned_doctor: patient.assignedDoctor ?? null,
    assigned_chw: patient.assignedCHW ?? null,
    source_channel: patient.sourceChannel,
    created_at: patient.createdAt,
    payload: patient,
  }),
});

export const listPatients = patientService.list;
export const upsertPatient = patientService.upsert;
export const upsertPatients = patientService.upsertMany;
