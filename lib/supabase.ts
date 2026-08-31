import { createClient } from "@supabase/supabase-js";
import type { Job } from "./types";

type Database = {
  public: {
    Tables: {
      jobs: {
        Row: Job;
        Insert: Partial<Job> & Pick<Job, "id" | "title" | "company" | "location" | "source" | "apply_url">;
        Update: Partial<Job>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false }
  });
}
