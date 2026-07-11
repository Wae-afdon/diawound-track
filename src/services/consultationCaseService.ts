import type { CHWConsultationCase } from "../types";
import { createSupabaseRecordService } from "./supabaseRecordService";

export const consultationCaseService = createSupabaseRecordService<CHWConsultationCase>({
  table: "chw_consultation_cases",
  select: "payload",
  orderColumn: "created_at",
  ascending: false,
  toRow: (caseItem) => ({
    id: caseItem.id,
    patient_id: caseItem.patientId,
    assessment_id: caseItem.assessmentId,
    chw_id: caseItem.chwId,
    status: caseItem.status,
    created_at: caseItem.createdAt,
    reviewed_at: caseItem.reviewedAt ?? null,
    payload: caseItem,
  }),
});

export const listConsultationCases = consultationCaseService.list;
export const upsertConsultationCase = consultationCaseService.upsert;
export const upsertConsultationCases = consultationCaseService.upsertMany;
