import { getSupabaseAdmin, hasSupabaseConfig } from "./supabase";
import { isPostedOnOrAfterCutoff, sortByPostedDateDesc } from "./job-policy";
import { sampleJobs } from "./sample-jobs";
import type { Job, JobInput } from "./types";

async function listBundledJobs(): Promise<Job[]> {
  try {
    const bundled = await import("../data/jobs.json");
    return (bundled.default as Job[])
      .filter((job) => job.active && isPostedOnOrAfterCutoff(job.posted_at))
      .sort(sortByPostedDateDesc);
  } catch {
    return sampleJobs;
  }
}

export async function listJobs(): Promise<Job[]> {
  if (!hasSupabaseConfig()) {
    return listBundledJobs();
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("active", true)
    .order("posted_at", { ascending: false })
    .order("first_seen_at", { ascending: false })
    .limit(500);

  if (error) {
    throw error;
  }

  return data?.length
    ? data.filter((job) => isPostedOnOrAfterCutoff(job.posted_at)).sort(sortByPostedDateDesc)
    : listBundledJobs();
}

export async function upsertJobs(jobs: JobInput[]) {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured");
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (jobs.length === 0) {
    return { count: 0 };
  }

  const { error } = await supabase.from("jobs").upsert(
    jobs.map((job) => ({
      ...job,
      active: true,
      last_seen_at: now,
      updated_at: now
    })),
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }

  return { count: jobs.length };
}
