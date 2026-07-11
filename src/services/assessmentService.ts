import type { AssessmentRecord } from "../types";
import { createSupabaseRecordService } from "./supabaseRecordService";

export const assessmentService = createSupabaseRecordService<AssessmentRecord>({
  table: "assessments",
  select: "payload,image_url",
  orderColumn: "created_at",
  ascending: false,
  toRow: (assessment) => ({
    id: assessment.id,
    patient_id: assessment.patientId,
    patient_code: assessment.patientCode,
    review_status: assessment.reviewStatus,
    risk_level: assessment.riskLevel,
    clinical_phase: assessment.clinicalPhase,
    image_url: assessment.imageDataUrl,
    created_at: assessment.createdAt,
    updated_at: assessment.updatedAt ?? new Date().toISOString(),
    payload: assessment,
  }),
  fromRow: (row) => ({
    ...row.payload,
    imageDataUrl: row.image_url || row.payload.imageDataUrl,
  }),
});

export const listAssessments = assessmentService.list;
export const upsertAssessment = assessmentService.upsert;
export const upsertAssessments = assessmentService.upsertMany;
