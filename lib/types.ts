export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  apply_url: string;
  description: string | null;
  category: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  active: boolean;
  posted_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  updated_at: string;
};

export type JobInput = Omit<Job, "active" | "first_seen_at" | "last_seen_at" | "updated_at">;
