import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchAllJobs } from "../lib/job-fetchers";
import { isPostedOnOrAfterCutoff, sortByPostedDateDesc } from "../lib/job-policy";
import type { Job, JobInput } from "../lib/types";

function normalizedKey(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(?:hong kong|hk|sar|china)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function roleKey(job: JobInput) {
  return [job.company, job.title, job.location].map(normalizedKey).join("|");
}

export async function readExistingJobs(filePath: string): Promise<Job[]> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.some((job) =>
    !job || typeof job !== "object" ||
    ![job.id, job.title, job.company, job.location, job.apply_url].every((value) =>
      typeof value === "string" && value.trim().length > 0
    )
  )) {
    throw new Error("Invalid existing jobs snapshot; refusing to replace historical listings.");
  }
  // Published records are preserved verbatim, even when source filters change.
  return parsed as Job[];
}

export function mergeJobs(existingJobs: Job[], fetchedJobs: JobInput[], now: string) {
  const jobs = [...existingJobs];
  const ids = new Set(existingJobs.map((job) => job.id));
  const urls = new Set(existingJobs.map((job) => job.apply_url.trim()));
  const roles = new Set(existingJobs.map(roleKey));
  let newCount = 0;

  // fetchAllJobs applies the existing location, finance, internship and experience
  // rules to incoming roles. Never re-filter, deduplicate or overwrite history.
  for (const job of fetchedJobs) {
    const key = roleKey(job);
    const url = job.apply_url.trim();
    if (!isPostedOnOrAfterCutoff(job.posted_at) ||
        ids.has(job.id) || urls.has(url) || roles.has(key)) continue;

    jobs.push({
      ...job,
      active: true,
      first_seen_at: now,
      last_seen_at: now,
      updated_at: now
    });
    ids.add(job.id);
    urls.add(url);
    roles.add(key);
    newCount += 1;
  }

  return {
    jobs: jobs.sort(sortByPostedDateDesc),
    newCount,
    fetchedCount: fetchedJobs.length,
    retainedCount: existingJobs.length
  };
}

async function main() {
  const now = new Date().toISOString();
  const outDir = path.join(process.cwd(), "data");
  const outFile = path.join(outDir, "jobs.json");
  const existingJobs = await readExistingJobs(outFile);
  const { jobs, errors } = await fetchAllJobs();
  const merged = mergeJobs(existingJobs, jobs, now);

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, `${JSON.stringify(merged.jobs, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${merged.jobs.length} jobs to ${outFile} (${merged.newCount} new, ${merged.fetchedCount} fetched today, ${merged.retainedCount} retained)`
  );
  if (errors.length) {
    console.warn("Some sources failed:");
    for (const error of errors) console.warn(`- ${error}`);
  }
}

if (process.argv[1] && /(?:^|[/\\])refresh-jobs\.(?:ts|js)$/.test(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
