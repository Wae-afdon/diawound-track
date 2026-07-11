import { isSupabaseConfigured, requireSupabase } from "../lib/supabase";

type SupabasePayloadRow<T> = {
  id: string;
  payload: T;
  created_at?: string | null;
  updated_at?: string | null;
  image_url?: string | null;
};

export type SupabaseRecordService<T extends { id: string }> = {
  list: () => Promise<T[]>;
  upsert: (item: T) => Promise<void>;
  upsertMany: (items: T[]) => Promise<void>;
};

export type RecordTableConfig<T extends { id: string }> = {
  table: string;
  select?: string;
  orderColumn?: string;
  ascending?: boolean;
  toRow: (item: T) => Record<string, unknown>;
  fromRow?: (row: SupabasePayloadRow<T>) => T;
};

const defaultFromRow = <T extends { id: string }>(row: SupabasePayloadRow<T>): T => row.payload;

export function createSupabaseRecordService<T extends { id: string }>({
  table,
  select = "payload",
  orderColumn = "created_at",
  ascending = true,
  toRow,
  fromRow = defaultFromRow,
}: RecordTableConfig<T>): SupabaseRecordService<T> {
  return {
    async list() {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await requireSupabase()
        .from(table)
        .select(select)
        .order(orderColumn, { ascending });
      if (error) throw error;
      return (data ?? []).map((row) => fromRow(row as unknown as SupabasePayloadRow<T>));
    },
    async upsert(item) {
      if (!isSupabaseConfigured) return;
      const { error } = await requireSupabase()
        .from(table)
        .upsert(toRow(item), { onConflict: "id" });
      if (error) throw error;
    },
    async upsertMany(items) {
      if (!isSupabaseConfigured || items.length === 0) return;
      const { error } = await requireSupabase()
        .from(table)
        .upsert(items.map(toRow), { onConflict: "id" });
      if (error) throw error;
    },
  };
}

export function formatSupabaseError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Supabase request failed";
}
