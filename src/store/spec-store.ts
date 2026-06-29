import { create } from "zustand";
import type { SchemaFormat } from "@/lib/supabase/types";

/** Parsed OpenAPI/Swagger document. The Viewer reads this; the Editor writes it. */
export type OpenApiDocument = Record<string, unknown>;

export interface ParsedResult {
  parsedSpec: OpenApiDocument | null;
  errors: string[];
}

export interface SpecState extends ParsedResult {
  /** Raw editor content. */
  rawText: string;
  /** Detected/selected format of the raw content. */
  format: SchemaFormat;
  setRawText: (rawText: string) => void;
  setFormat: (format: SchemaFormat) => void;
  setParsedResult: (result: ParsedResult) => void;
  reset: () => void;
}

const initialState: ParsedResult & { rawText: string; format: SchemaFormat } = {
  rawText: "",
  format: "yaml",
  parsedSpec: null,
  errors: [],
};

/**
 * Shared spec state — the seam between the Editor (writes) and the Viewer (reads).
 */
export const useSpecStore = create<SpecState>((set) => ({
  ...initialState,
  setRawText: (rawText) => set({ rawText }),
  setFormat: (format) => set({ format }),
  setParsedResult: ({ parsedSpec, errors }) => set({ parsedSpec, errors }),
  reset: () => set(initialState),
}));
