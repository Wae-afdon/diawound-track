import type { DoctorCorrection } from "../types";
import { createSupabaseRecordService } from "./supabaseRecordService";

export const doctorCorrectionService = createSupabaseRecordService<DoctorCorrection>({
  table: "doctor_corrections",
  select: "payload",
  orderColumn: "created_at",
  ascending: false,
  toRow: (correction) => ({
    id: correction.id,
    patient_id: correction.patientId,
    assessment_id: correction.assessmentId,
    corrected_by: correction.correctedBy,
    created_at: correction.createdAt,
    payload: correction,
  }),
});

export const listDoctorCorrections = doctorCorrectionService.list;
export const upsertDoctorCorrection = doctorCorrectionService.upsert;
export const upsertDoctorCorrections = doctorCorrectionService.upsertMany;
