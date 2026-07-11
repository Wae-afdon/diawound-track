import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import type { SupabaseRecordService } from "../services/supabaseRecordService";
import { formatSupabaseError } from "../services/supabaseRecordService";

export type SupabaseSyncState = {
  loading: boolean;
  error: string;
  status: string;
};

export function useSupabaseSyncedArray<T extends { id: string }>(
  initialValue: T[],
  service: SupabaseRecordService<T>,
  label: string,
): [T[], Dispatch<SetStateAction<T[]>>, () => void, SupabaseSyncState] {
  const [value, setValue] = useState<T[]>(initialValue);
  const [syncState, setSyncState] = useState<SupabaseSyncState>({
    loading: isSupabaseConfigured,
    error: "",
    status: isSupabaseConfigured ? "Loading..." : "Supabase not configured; using in-memory demo data.",
  });

  useEffect(() => {
    let alive = true;
    if (!isSupabaseConfigured) return undefined;

    setSyncState((previous) => ({ ...previous, loading: true, error: "", status: `Loading ${label}...` }));
    service
      .list()
      .then((remoteValue) => {
        if (!alive) return;
        if (remoteValue.length > 0) setValue(remoteValue);
        setSyncState({ loading: false, error: "", status: "Cloud sync ready" });
      })
      .catch((error) => {
        if (!alive) return;
        setSyncState({
          loading: false,
          error: formatSupabaseError(error),
          status: `Cannot load ${label}`,
        });
      });

    return () => {
      alive = false;
    };
  }, [label, service]);

  const setSyncedValue: Dispatch<SetStateAction<T[]>> = (next) => {
    setValue((previous) => {
      const resolved = typeof next === "function" ? (next as (previous: T[]) => T[])(previous) : next;
      if (isSupabaseConfigured) {
        service
          .upsertMany(resolved)
          .then(() => setSyncState((state) => ({ ...state, error: "", status: "Saved successfully" })))
          .catch((error) =>
            setSyncState({
              loading: false,
              error: formatSupabaseError(error),
              status: "Failed to save",
            }),
          );
      }
      return resolved;
    });
  };

  const reset = () => {
    setSyncedValue(initialValue);
  };

  return [value, setSyncedValue, reset, syncState];
}
