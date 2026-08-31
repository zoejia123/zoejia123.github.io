import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchAllJobs, hasRequiredExperience } from "../lib/job-fetchers";
import { isPostedOnOrAfterCutoff, sortByPostedDateDesc } from "../lib/job-policy";
import type { Job, JobInput } from "../lib/types";

function isCleanHistoricalJob(job: Partial<Job>) {
  const text = `${job.title ?? ""} ${job.description ?? ""}`;

  return (
    !/\bintern(ship)?\b|summer internship|off[- ]cycle|summer\s+(?:financial\s+)?analyst/i.test(text) &&
    isPostedOnOrAfterCutoff(job.posted_at) &&
    !hasRequiredExperience(text) &&
    !/\bsenior\b|\bintermediate\b|\bmanager\b|\bdirector\b|\blead\b|\bprincipal\b|\bstaff\b|\bvice president\b|\bvp\b/i.test(
      job.title ?? ""
    ) &&
    !/\binformation technology\b|\bit service\b|\bservice management\b|\btechnology service\b|\bidentity and access\b|\buser acceptance testing\b|\bdigital\b|\bsoftware\b|\bengineer\b/i.test(
      job.title ?? ""
    ) &&
    !/^macau\b|malaysia|cyberjaya|my-aia/i.test(job.location ?? "")
  );
}

function normalizedKey(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(?:hong kong|hk|sar|china)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeJobs(jobs: Job[]) {
  const byKey = new Map<string, Job>();

  for (const job of jobs) {
    const key = [job.company, job.title, job.location].map(normalizedKey).join("|");
    const existing = byKey.get(key);

    if (!existing || sortByPostedDateDesc(job, existing) < 0) {
      byKey.set(key, job);
    }
  }

  return Array.from(byKey.values()).sort(sortByPostedDateDesc);
}

async function readExistingJobs(filePath: string, now: string): Promise<Job[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Array<Partial<Job>>;

    return parsed
      .filter((job): job is Job => Boolean(job.id && job.title && job.company && job.apply_url))
      .filter(isCleanHistoricalJob)
      .map((job) => ({
        ...job,
        description: job.description ?? null,
        category: job.category ?? null,
        salary_min: job.salary_min ?? null,
        salary_max: job.salary_max ?? null,
        currency: job.currency ?? null,
        active: job.active ?? true,
        posted_at: job.posted_at ?? null,
        first_seen_at: job.first_seen_at ?? now,
        last_seen_at: job.last_seen_at ?? job.first_seen_at ?? now,
        updated_at: job.updated_at ?? now
      }));
  } catch {
    return [];
  }
}

function mergeJobs(existingJobs: Job[], fetchedJobs: JobInput[], now: string) {
  const byId = new Map(existingJobs.map((job) => [job.id, job]));
  let newCount = 0;

  for (const job of fetchedJobs) {
    const existing = byId.get(job.id);

    if (!existing) {
      newCount += 1;
    }

    byId.set(job.id, {
      ...existing,
      ...job,
      active: true,
      posted_at: job.posted_at ?? existing?.posted_at ?? null,
      first_seen_at: existing?.first_seen_at ?? now,
      last_seen_at: now,
      updated_at: now
    });
  }

  return {
    jobs: dedupeJobs(Array.from(byId.values()).filter((job) => isPostedOnOrAfterCutoff(job.posted_at))),
    newCount,
    fetchedCount: fetchedJobs.length,
    retainedCount: Math.max(0, byId.size - fetchedJobs.length)
  };
}

async function main() {
  const now = new Date().toISOString();

  const { jobs, errors } = await fetchAllJobs();
  const outDir = path.join(process.cwd(), "data");
  const outFile = path.join(outDir, "jobs.json");
  const existingJobs = await readExistingJobs(outFile, now);
  const merged = mergeJobs(existingJobs, jobs, now);

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, `${JSON.stringify(merged.jobs, null, 2)}\n`, "utf8");

  console.log(
    `Wrote ${merged.jobs.length} jobs to ${outFile} (${merged.newCount} new, ${merged.fetchedCount} fetched today, ${merged.retainedCount} retained)`
  );

  if (errors.length) {
    console.warn("Some sources failed:");
    for (const error of errors) {
      console.warn(`- ${error}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
