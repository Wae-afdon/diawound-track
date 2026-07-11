import type { DoctorDatasetEntry } from "../types";
import { createSupabaseRecordService } from "./supabaseRecordService";

export const doctorDatasetService = createSupabaseRecordService<DoctorDatasetEntry>({
  table: "doctor_dataset_entries",
  select: "payload,image_url",
  orderColumn: "created_at",
  ascending: false,
  toRow: (entry) => ({
    id: entry.id,
    source_type: entry.sourceType,
    wound_type: entry.woundType,
    clinical_phase: entry.clinicalPhase,
    image_url: entry.imageDataUrl,
    created_at: entry.createdAt,
    payload: entry,
  }),
  fromRow: (row) => ({
    ...row.payload,
    imageDataUrl: row.image_url || row.payload.imageDataUrl,
  }),
});

export const listDoctorDatasetEntries = doctorDatasetService.list;
export const upsertDoctorDatasetEntry = doctorDatasetService.upsert;
export const upsertDoctorDatasetEntries = doctorDatasetService.upsertMany;
