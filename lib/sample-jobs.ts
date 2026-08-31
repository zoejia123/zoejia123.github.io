import type { Job } from "./types";

export const sampleJobs: Job[] = [
  {
    id: "sample-investment-analyst",
    title: "Investment Analyst",
    company: "Sample Capital",
    location: "Hong Kong",
    source: "Sample",
    apply_url: "https://www.linkedin.com/jobs/search/?keywords=investment%20analyst&location=Hong%20Kong",
    description:
      "Review investment opportunities, build valuation models, prepare market research, and support portfolio monitoring for Hong Kong and Greater China assets.",
    category: "Investment",
    salary_min: null,
    salary_max: null,
    currency: null,
    active: true,
    posted_at: null,
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "sample-risk-analyst",
    title: "Risk Analyst",
    company: "Sample Bank",
    location: "Hong Kong",
    source: "Sample",
    apply_url: "https://www.linkedin.com/jobs/search/?keywords=risk%20analyst%20finance&location=Hong%20Kong",
    description:
      "Support risk reporting, monitor portfolio exposure, analyze market and credit risk indicators, and work with front-office and compliance teams.",
    category: "Risk",
    salary_min: null,
    salary_max: null,
    currency: null,
    active: true,
    posted_at: null,
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
