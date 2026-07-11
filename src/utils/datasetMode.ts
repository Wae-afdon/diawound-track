import type { DataMode } from "../types";

export const DATA_MODE_STORAGE_KEY = "woundsense_data_mode";

export function getDataMode(): DataMode {
  if (typeof localStorage === "undefined") return "mock";
  const stored = localStorage.getItem(DATA_MODE_STORAGE_KEY);
  return stored === "real_dataset_preview" ? "real_dataset_preview" : "mock";
}

export function setDataMode(mode: DataMode) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DATA_MODE_STORAGE_KEY, mode);
}

export function isRealDatasetPreviewMode(mode = getDataMode()) {
  return mode === "real_dataset_preview";
}
