import { ChevronDown, ExternalLink, RefreshCw } from "lucide-react";
import { minPostedDate } from "@/lib/job-policy";
import { listJobs } from "@/lib/jobs-store";

export const dynamic = "force-dynamic";

function cleanCompany(value: string) {
  return value
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function cleanDescription(value: string | null) {
  if (!value) {
    return null;
  }

  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export default async function Home() {
  const jobs = await listJobs();

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Daily refreshed</p>
          <h1>Hong Kong Finance Jobs</h1>
        </div>
        <div className="refresh-note">
          <RefreshCw aria-hidden="true" size={16} />
          <span>Newest first · since {minPostedDate}</span>
        </div>
      </header>

      <section className="jobs-panel" aria-label="Available roles">
        <div className="table-header">
          <span>Role</span>
          <span>Company</span>
          <span>Location</span>
          <span>Source</span>
          <span className="apply-heading">Apply</span>
        </div>

        <div className="jobs-list">
          {jobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="job-row">
                <div className="job-title">{job.title}</div>
                <div>{cleanCompany(job.company)}</div>
                <div>{job.location}</div>
                <div>{job.source}</div>
                <a className="apply-link" href={job.apply_url} target="_blank" rel="noreferrer">
                  <span>Apply</span>
                  <ExternalLink aria-hidden="true" size={16} />
                </a>
              </div>

              <details className="jd-details">
                <summary>
                  <span>JD</span>
                  <ChevronDown aria-hidden="true" size={16} />
                </summary>
                <div className="jd-body">
                  {(() => {
                    const description = cleanDescription(job.description);
                    return description ? <p>{description}</p> : <p>Full job description is available on the source application page.</p>;
                  })()}
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
