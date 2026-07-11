import type { DailyReminder } from "../types";
import { createSupabaseRecordService } from "./supabaseRecordService";

export const reminderService = createSupabaseRecordService<DailyReminder>({
  table: "daily_reminders",
  select: "payload",
  orderColumn: "created_at",
  ascending: true,
  toRow: (reminder) => ({
    id: reminder.id,
    patient_id: reminder.patientId,
    frequency: reminder.frequency,
    reminder_time: reminder.reminderTime,
    active: reminder.active,
    created_at: reminder.createdAt,
    payload: reminder,
  }),
});

export const listDailyReminders = reminderService.list;
export const upsertDailyReminder = reminderService.upsert;
export const upsertDailyReminders = reminderService.upsertMany;
