/**
 * Database schema types. Kept in sync with supabase/migrations.
 * Can later be replaced by `supabase gen types typescript`.
 */

export type SchemaFormat = "json" | "yaml";

export interface Database {
  public: {
    Tables: {
      schemas: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          format: SchemaFormat;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          format: SchemaFormat;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          format?: SchemaFormat;
          updated_at?: string;
        };
        Relationships: [];
      };
      requests: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          method: string;
          url: string;
          endpoint_path: string | null;
          status_code: number | null;
          duration_ms: number;
          request_size: number;
          response_size: number;
          error_detail: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          method: string;
          url: string;
          endpoint_path?: string | null;
          status_code?: number | null;
          duration_ms?: number;
          request_size?: number;
          response_size?: number;
          error_detail?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          method?: string;
          url?: string;
          endpoint_path?: string | null;
          status_code?: number | null;
          duration_ms?: number;
          request_size?: number;
          response_size?: number;
          error_detail?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type SchemaRow = Database["public"]["Tables"]["schemas"]["Row"];
export type RequestRow = Database["public"]["Tables"]["requests"]["Row"];
export type RequestInsert = Database["public"]["Tables"]["requests"]["Insert"];
