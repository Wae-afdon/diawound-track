import type { ClinicPartner } from "../types";
import { createSupabaseRecordService } from "./supabaseRecordService";

export const clinicService = createSupabaseRecordService<ClinicPartner>({
  table: "clinic_partners",
  select: "payload",
  orderColumn: "name",
  ascending: true,
  toRow: (clinic) => ({
    id: clinic.id,
    name: clinic.name,
    type: clinic.type,
    uses_diawound_track: clinic.usesDiaWoundTrack,
    payload: clinic,
  }),
});

export const listClinicPartners = clinicService.list;
export const upsertClinicPartner = clinicService.upsert;
export const upsertClinicPartners = clinicService.upsertMany;
