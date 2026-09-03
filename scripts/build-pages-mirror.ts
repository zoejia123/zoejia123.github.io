import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { sortByPostedDateDesc } from "../lib/job-policy";
import type { Job } from "../lib/types";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:h[1-6]|p|li)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
}

function renderJob(job: Job) {
  const description = cleanText(job.description);
  const postedAt = formatDate(job.posted_at);

  return `
    <article class="job">
      <div class="job-top">
        <div>
          <div class="title">${escapeHtml(job.title)}</div>
          <div class="meta">
            <span>${escapeHtml(job.company)}</span>
            <span>${escapeHtml(job.location)}</span>
            <span>${escapeHtml(job.source)}</span>
            ${postedAt ? `<span>${escapeHtml(postedAt)}</span>` : ""}
          </div>
        </div>
        <a class="apply" href="${escapeHtml(job.apply_url)}" target="_blank" rel="noreferrer">Apply</a>
      </div>
      <details class="details">
        <summary>JD</summary>
        <div class="body">${description ? `<pre>${escapeHtml(description)}</pre>` : "<p>Full job description is available on the source application page.</p>"}</div>
      </details>
    </article>
  `;
}

async function main() {
  const root = process.cwd();
  const dataPath = path.join(root, "data", "jobs.json");
  const outDir = path.join(root, "docs");
  const outPath = path.join(outDir, "index.html");
  const jobs = (JSON.parse(await readFile(dataPath, "utf8")) as Job[])
    .filter((job) => job.active)
    .sort(sortByPostedDateDesc);

  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>66offer Hong Kong Finance Jobs</title>
      <meta name="description" content="A daily refreshed list of finance jobs in Hong Kong." />
      <style>
        :root {
          color-scheme: light;
          --bg: #f5f7f4;
          --ink: #17211b;
          --muted: #5f6a62;
          --line: #d9e1d8;
          --panel: #ffffff;
          --accent: #0f766e;
          --accent-dark: #0b544f;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: var(--bg);
          color: var(--ink);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        a { color: inherit; }
        .shell {
          width: min(1120px, calc(100% - 32px));
          margin: 0 auto;
          padding: 40px 0;
        }
        .topbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }
        .eyebrow {
          margin: 0 0 6px;
          color: var(--accent-dark);
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3.5rem);
          line-height: 1;
        }
        .note {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 36px;
          padding: 8px 12px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--panel);
          color: var(--muted);
          white-space: nowrap;
        }
        .panel {
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--panel);
        }
        .head {
          display: grid;
          grid-template-columns: minmax(220px, 2.1fr) minmax(132px, 1fr) minmax(120px, 1fr) minmax(90px, 0.6fr) 104px;
          gap: 14px;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid var(--line);
          background: #edf3ed;
          color: var(--muted);
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .list { display: grid; }
        .job { border-bottom: 1px solid var(--line); color: var(--muted); }
        .job:last-child { border-bottom: 0; }
        .job-top {
          display: grid;
          grid-template-columns: minmax(220px, 2.1fr) minmax(132px, 1fr) minmax(120px, 1fr) minmax(90px, 0.6fr) 104px;
          gap: 14px;
          align-items: center;
          min-height: 76px;
          padding: 16px 18px 12px;
        }
        .title { color: var(--ink); font-weight: 760; }
        .meta { display: flex; flex-wrap: wrap; gap: 8px 14px; margin-top: 4px; font-size: 0.92rem; }
        .apply {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          border-radius: 8px;
          background: var(--accent);
          color: #fff;
          font-weight: 800;
          text-decoration: none;
        }
        .details { padding: 0 18px 16px; }
        .details summary {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          color: var(--accent-dark);
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 800;
          list-style: none;
        }
        .details summary::-webkit-details-marker { display: none; }
        .body {
          margin-top: 8px;
          padding: 14px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: #f8faf7;
          color: #354139;
          line-height: 1.55;
        }
        .body pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font: inherit;
        }
        @media (max-width: 760px) {
          .shell { width: min(100% - 24px, 680px); padding: 24px 0; }
          .topbar { display: grid; align-items: start; }
          .note { width: fit-content; white-space: normal; }
          .head { display: none; }
          .panel { border: 0; background: transparent; }
          .list { gap: 10px; }
          .job { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
          .job-top {
            grid-template-columns: 1fr;
            min-height: 0;
            padding-bottom: 14px;
          }
          .apply { width: 104px; }
        }
      </style>
    </head>
    <body>
      <main class="shell">
        <header class="topbar">
          <div>
            <p class="eyebrow">Daily refreshed</p>
            <h1>66offer Hong Kong Finance Jobs</h1>
          </div>
          <div class="note">Newest first · since 2026-07-01</div>
        </header>
        <section class="panel" aria-label="Available roles">
          <div class="head">
            <span>Role</span>
            <span>Company</span>
            <span>Location</span>
            <span>Source</span>
            <span>Apply</span>
          </div>
          <div class="list">
            ${jobs.map(renderJob).join("\n")}
          </div>
        </section>
      </main>
    </body>
  </html>`;

  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, html, "utf8");
  await writeFile(path.join(root, "index.html"), html, "utf8");
  await writeFile(path.join(outDir, ".nojekyll"), "", "utf8");
  await writeFile(path.join(outDir, "jobs.json"), `${JSON.stringify(jobs, null, 2)}\n`, "utf8");
  console.log(`Wrote mirror with ${jobs.length} jobs to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
