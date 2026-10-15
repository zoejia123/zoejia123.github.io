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

function cleanLocation(value: string) {
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  const compact = parts.filter((part, index) => part !== parts[index - 1]);
  const half = compact.length / 2;
  if (Number.isInteger(half) && compact.slice(0, half).join("|") === compact.slice(half).join("|")) {
    return compact.slice(0, half).join(", ");
  }
  return compact.join(", ");
}

function isGraduateFriendly(job: Job, description: string | null) {
  const text = `${job.title} ${job.category ?? ""} ${description ?? ""}`.toLowerCase();
  return /\bgraduate(?:s| programme| program)?\b|\bnew grad\b|\bentry[- ]level\b|\btrainee\b|\banalyst\b|\bassociate\b|\bjunior\b|\bclient services?\b|\boperations?\b/.test(text) &&
    !/\b(?:senior|manager|director|vice president|\bvp\b|head of|lead)\b/.test(job.title.toLowerCase());
}

function renderJob(job: Job) {
  const description = cleanText(job.description);
  const postedAt = formatDate(job.posted_at);
  const location = cleanLocation(job.location);
  const searchable = `${job.title} ${job.company} ${location} ${job.source}`.toLowerCase();
  const graduateFriendly = isGraduateFriendly(job, description);

  return `
    <article class="job" data-search="${escapeHtml(searchable)}" data-company="${escapeHtml(job.company)}" data-source="${escapeHtml(job.source)}" data-graduate="${graduateFriendly}">
      <div class="job-top">
        <div class="role-cell">
          <div class="title">${escapeHtml(job.title)}</div>
          ${postedAt ? `<time datetime="${escapeHtml(postedAt)}">Posted ${escapeHtml(postedAt)}</time>` : ""}
        </div>
        <div class="company">${escapeHtml(job.company)}</div>
        <div class="location">${escapeHtml(location)}</div>
        <div><span class="source">${escapeHtml(job.source)}</span></div>
        <a class="apply" href="${escapeHtml(job.apply_url)}" target="_blank" rel="noreferrer">Apply <span aria-hidden="true">↗</span></a>
      </div>
      <details class="details">
        <summary>View job description <span aria-hidden="true">⌄</span></summary>
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
  const companies = [...new Set(jobs.map((job) => job.company))].sort((a, b) => a.localeCompare(b));
  const sources = [...new Set(jobs.map((job) => job.source))].sort((a, b) => a.localeCompare(b));

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
          --bg: #f3f6f4;
          --ink: #10231c;
          --muted: #617068;
          --line: #dce5df;
          --panel: #ffffff;
          --accent: #0f766e;
          --accent-dark: #0b544f;
          --soft: #e8f4ef;
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
          padding: 48px 0 72px;
        }
        .topbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
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
          border-radius: 999px;
          background: var(--panel);
          color: var(--muted);
          white-space: nowrap;
        }
        .intro { max-width: 650px; margin: 12px 0 0; color: var(--muted); line-height: 1.6; }
        .toolbar {
          display: grid;
          grid-template-columns: minmax(260px, 1.6fr) 1fr 1fr 1fr auto;
          gap: 10px;
          margin-bottom: 14px;
          padding: 12px;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: rgba(255,255,255,.82);
          box-shadow: 0 10px 35px rgba(16,35,28,.06);
        }
        .field { position: relative; }
        .field input, .field select {
          width: 100%; height: 44px; padding: 0 13px; border: 1px solid var(--line); border-radius: 10px;
          background: #fff; color: var(--ink); font: inherit; outline: none;
        }
        .field input { padding-left: 38px; }
        .field-icon { position: absolute; left: 13px; top: 12px; color: var(--muted); pointer-events: none; }
        .field input:focus, .field select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(15,118,110,.12); }
        .clear { height: 44px; padding: 0 15px; border: 0; border-radius: 10px; background: var(--soft); color: var(--accent-dark); font-weight: 750; cursor: pointer; }
        .results-bar { display: flex; justify-content: space-between; align-items: center; margin: 0 2px 12px; color: var(--muted); font-size: .92rem; }
        .results-bar strong { color: var(--ink); }
        .panel {
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--panel);
          box-shadow: 0 18px 50px rgba(16,35,28,.07);
        }
        .head {
          display: grid;
          grid-template-columns: minmax(220px, 2.1fr) minmax(132px, 1fr) minmax(120px, 1fr) minmax(90px, 0.6fr) 104px;
          gap: 14px;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid var(--line);
          background: #f0f5f2;
          color: var(--muted);
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .list { display: grid; }
        .job { border-bottom: 1px solid var(--line); color: var(--muted); transition: background 150ms ease; }
        .job:hover { background: #fbfdfc; }
        .job[hidden] { display: none; }
        .job:last-child { border-bottom: 0; }
        .job-top {
          display: grid;
          grid-template-columns: minmax(220px, 2.1fr) minmax(132px, 1fr) minmax(120px, 1fr) minmax(90px, 0.6fr) 104px;
          gap: 14px;
          align-items: center;
          min-height: 76px;
          padding: 16px 18px 12px;
        }
        .title { color: var(--ink); font-weight: 760; line-height: 1.35; }
        time { display: block; margin-top: 7px; font-size: .78rem; color: #7a8981; }
        .company { color: #30443b; font-weight: 650; }
        .location { font-size: .9rem; line-height: 1.4; }
        .source { display: inline-flex; padding: 5px 9px; border-radius: 999px; background: #f0f5f2; color: #506159; font-size: .75rem; font-weight: 750; }
        .apply {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          border-radius: 10px;
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
          color: var(--accent);
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 700;
          list-style: none;
        }
        .details summary::-webkit-details-marker { display: none; }
        .details summary span { display: inline-block; margin-left: 6px; transition: transform 160ms ease; }
        .details[open] summary span { transform: rotate(180deg); }
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
        .empty { display: none; padding: 52px 20px; text-align: center; color: var(--muted); }
        .empty.visible { display: block; }
        @media (max-width: 760px) {
          .shell { width: min(100% - 24px, 680px); padding: 24px 0; }
          .topbar { display: grid; align-items: start; }
          .note { width: fit-content; white-space: normal; }
          .toolbar { grid-template-columns: 1fr; }
          .head { display: none; }
          .panel { border: 0; background: transparent; }
          .list { gap: 10px; }
          .job { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
          .job-top {
            grid-template-columns: 1fr;
            gap: 8px;
            min-height: 0;
            padding-bottom: 14px;
          }
          .apply { width: 100%; margin-top: 6px; }
          .company::before { content: "Company · "; color: #86938c; font-weight: 500; }
          .location::before { content: "Location · "; color: #86938c; }
          .source { margin-top: 2px; }
        }
      </style>
    </head>
    <body>
      <main class="shell">
        <header class="topbar">
          <div>
            <p class="eyebrow">Daily refreshed</p>
            <h1>66offer Hong Kong Finance Jobs</h1>
            <p class="intro">Fresh finance opportunities across Hong Kong, gathered in one place so you can spend less time searching and more time applying.</p>
          </div>
          <div class="note">Newest first · since 2026-08-15</div>
        </header>
        <section class="toolbar" aria-label="Filter jobs">
          <label class="field"><span class="field-icon" aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Search roles, companies or locations" autocomplete="off" /></label>
          <label class="field"><select id="company"><option value="">All companies</option>${companies.map((company) => `<option>${escapeHtml(company)}</option>`).join("")}</select></label>
          <label class="field"><select id="source"><option value="">All sources</option>${sources.map((source) => `<option>${escapeHtml(source)}</option>`).join("")}</select></label>
          <label class="field"><select id="level"><option value="">All experience levels</option><option value="graduate">Graduate-friendly</option></select></label>
          <button class="clear" id="clear" type="button">Clear</button>
        </section>
        <div class="results-bar" aria-live="polite"><span><strong id="count">${jobs.length}</strong> opportunities</span><span>Newest first</span></div>
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
          <div class="empty" id="empty"><strong>No matching roles</strong><br />Try a broader search or clear your filters.</div>
        </section>
      </main>
      <script>
        const jobs = [...document.querySelectorAll('.job')];
        const search = document.querySelector('#search');
        const company = document.querySelector('#company');
        const source = document.querySelector('#source');
        const count = document.querySelector('#count');
        const empty = document.querySelector('#empty');
        function filterJobs() {
          const query = search.value.trim().toLowerCase();
          let visible = 0;
          jobs.forEach((job) => {
          const match = (!query || job.dataset.search.includes(query)) && (!company.value || job.dataset.company === company.value) && (!source.value || job.dataset.source === source.value) && (!level.value || job.dataset.graduate === 'true');
            job.hidden = !match;
            if (match) visible += 1;
          });
          count.textContent = visible;
          empty.classList.toggle('visible', visible === 0);
        }
        const level = document.querySelector('#level');
        [search, company, source, level].forEach((control) => control.addEventListener('input', filterJobs));
        document.querySelector('#clear').addEventListener('click', () => { search.value = ''; company.value = ''; source.value = ''; level.value = ''; filterJobs(); search.focus(); });
      </script>
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
