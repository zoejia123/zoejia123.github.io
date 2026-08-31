import type { Job } from "./types";

export const minPostedDate = "2026-07-01";

export function dateValue(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function postedDateKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (isoDate) {
    return isoDate;
  }

  const time = dateValue(value);

  if (!time) {
    return null;
  }

  return new Date(time).toISOString().slice(0, 10);
}

export function isPostedOnOrAfterCutoff(value: string | null | undefined) {
  const key = postedDateKey(value);
  return Boolean(key && key >= minPostedDate);
}

type SortableJob = Pick<Job, "posted_at" | "company" | "title"> & Partial<Pick<Job, "first_seen_at">>;

export function sortByPostedDateDesc(a: SortableJob, b: SortableJob) {
  return (
    dateValue(b.posted_at) - dateValue(a.posted_at) ||
    dateValue(b.first_seen_at) - dateValue(a.first_seen_at) ||
    a.company.localeCompare(b.company) ||
    a.title.localeCompare(b.title)
  );
}
