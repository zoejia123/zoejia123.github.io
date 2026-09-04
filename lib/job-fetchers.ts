import crypto from "node:crypto";
import { isPostedOnOrAfterCutoff, minPostedDate, sortByPostedDateDesc } from "./job-policy";
import type { JobInput } from "./types";

const financeKeywords = [
  "finance",
  "investment analyst",
  "asset management",
  "banking analyst",
  "risk analyst",
  "compliance analyst",
  "quant analyst",
  "financial analyst"
];

const museKeywords = [
  "finance",
  "financial analyst",
  "investment analyst",
  "banking analyst",
  "risk analyst",
  "compliance analyst",
  "trading",
  "sales and trading",
  "sales support",
  "client service",
  "middle office",
  "trade support",
  "prime brokerage",
  "graduate analyst",
  "graduate programme",
  "graduate program",
  "associate finance",
  "investment banking",
  "capital markets",
  "equities",
  "fixed income",
  "equity research",
  "trading assistant",
  "wealth management",
  "private bank",
  "treasury sales",
  "business development",
  "account management",
  "asset management",
  "fund reporting",
  "listed structured products"
];

const workdaySearchTerms = [
  "Hong Kong",
  "graduate",
  "analyst",
  "associate",
  "sales",
  "sales support",
  "client service",
  "account",
  "accounting",
  "finance",
  "financial",
  "officer",
  "markets",
  "capital markets",
  "wealth",
  "wealth management",
  "private bank",
  "investment",
  "investment banking",
  "equity research",
  "credit",
  "treasury",
  "treasury sales",
  "risk",
  "operations",
  "middle office",
  "trade support",
  "audit",
  "aml",
  "payments",
  "business development",
  "account management",
  "graduate programme",
  "graduate program"
];

const companyNames: Record<string, string> = {
  janestreet: "Jane Street",
  jumptrading: "Jump Trading",
  okx: "OKX",
  point72: "Point72",
  aqr: "AQR Capital Management",
  citadel: "Citadel",
  hudsonrivertrading: "Hudson River Trading",
  ripple: "Ripple",
  towerresearchcapital: "Tower Research Capital",
  imc: "IMC",
  eclipsetrading: "Eclipse Trading",
  flowtraders: "Flow Traders",
  dvtrading: "DV Trading",
  thunes: "Thunes",
  xendit: "Xendit",
  worldquant: "WorldQuant",
  animocabrands: "Animoca Brands",
  ambergroup: "Amber Group",
  crypto: "Crypto.com",
  binance: "Binance",
  leversys: "Leversys",
  "wintermute-trading": "Wintermute",
  coins: "Coins",
  airwallex: "Airwallex",
  elliptic: "Elliptic",
  lalamove: "Lalamove",
  "gersonlehrmangroup": "GLG",
  "checkout.com": "Checkout.com",
  pavebank: "Pave Bank"
};

const defaultGreenhouseBoards = [
  "point72",
  "janestreet",
  "jumptrading",
  "towerresearchcapital",
  "imc",
  "eclipsetrading",
  "flowtraders",
  "dvtrading",
  "thunes",
  "xendit",
  "worldquant",
  "ripple",
  "okx",
  "aqr",
  "hudsonrivertrading",
  "gersonlehrmangroup",
  "citadel",
  "drw",
  "virtu",
  "akuna",
  "alphagrep"
];

const defaultLeverCompanies = [
  "animocabrands",
  "ambergroup",
  "crypto",
  "binance",
  "leversys",
  "wintermute-trading",
  "coins",
  "lalamove",
  "bybit",
  "hashkey",
  "hextrust",
  "osl",
  "bitmex",
  "paxos",
  "circle",
  "shopline"
];

const defaultAshbyBoards = [
  "airwallex",
  "elliptic",
  "checkout.com",
  "pavebank",
  "wise",
  "revolut",
  "stripe",
  "plaid",
  "brex"
];

const defaultWorkdaySources = [
  {
    name: "Barclays",
    host: "barclays.wd3.myworkdayjobs.com",
    tenant: "barclays",
    site: "External_Career_Site_Barclays"
  },
  {
    name: "Mastercard",
    host: "mastercard.wd1.myworkdayjobs.com",
    tenant: "mastercard",
    site: "Campus"
  },
  {
    name: "Citi",
    host: "citi.wd5.myworkdayjobs.com",
    tenant: "citi",
    site: "2"
  },
  {
    name: "Houlihan Lokey",
    host: "hl.wd1.myworkdayjobs.com",
    tenant: "hl",
    site: "Campus"
  },
  {
    name: "Houlihan Lokey",
    host: "hl.wd1.myworkdayjobs.com",
    tenant: "hl",
    site: "Lateral"
  },
  {
    name: "MUFG",
    host: "mufgub.wd3.myworkdayjobs.com",
    tenant: "mufgub",
    site: "MUFG-Careers"
  },
  {
    name: "Deutsche Bank",
    host: "db.wd3.myworkdayjobs.com",
    tenant: "db",
    site: "DBWebsite"
  },
  {
    name: "HKEX",
    host: "hkex.wd3.myworkdayjobs.com",
    tenant: "hkex",
    site: "HKEXCareerPage"
  },
  {
    name: "Blackstone",
    host: "blackstone.wd1.myworkdayjobs.com",
    tenant: "blackstone",
    site: "Blackstone_Campus_Careers"
  },
  {
    name: "Huatai Securities",
    host: "htsc.wd102.myworkdayjobs.com",
    tenant: "htsc",
    site: "Huatai_Careers"
  },
  {
    name: "Castleton Commodities",
    host: "osv-cci.wd1.myworkdayjobs.com",
    tenant: "osv-cci",
    site: "CCICareers"
  },
  {
    name: "AIA",
    host: "aia.wd3.myworkdayjobs.com",
    tenant: "aia",
    site: "External"
  },
  {
    name: "Neuberger Berman",
    host: "nb.wd1.myworkdayjobs.com",
    tenant: "nb",
    site: "NBCareers"
  },
  {
    name: "BBVA",
    host: "bbva.wd3.myworkdayjobs.com",
    tenant: "bbva",
    site: "BBVA"
  },
  {
    name: "Julius Baer",
    host: "juliusbaer.wd3.myworkdayjobs.com",
    tenant: "juliusbaer",
    site: "External"
  },
  {
    name: "UOB",
    host: "uobgroup.wd3.myworkdayjobs.com",
    tenant: "uobgroup",
    site: "UOBExternal"
  },
  {
    name: "Moelis",
    host: "moelis.wd1.myworkdayjobs.com",
    tenant: "moelis",
    site: "University-Hires"
  },
  {
    name: "PJT Partners",
    host: "pjtpartners.wd1.myworkdayjobs.com",
    tenant: "pjtpartners",
    site: "Students"
  },
  {
    name: "Santander",
    host: "santander.wd3.myworkdayjobs.com",
    tenant: "santander",
    site: "SantanderCareers"
  },
  {
    name: "Northern Trust",
    host: "ntrs.wd1.myworkdayjobs.com",
    tenant: "ntrs",
    site: "northerntrust"
  },
  {
    name: "State Street",
    host: "statestreet.wd1.myworkdayjobs.com",
    tenant: "statestreet",
    site: "Global"
  },
  {
    name: "BlackRock",
    host: "blackrock.wd1.myworkdayjobs.com",
    tenant: "blackrock",
    site: "BlackRock_Professional"
  },
  {
    name: "S&P Global",
    host: "spgi.wd5.myworkdayjobs.com",
    tenant: "spgi",
    site: "SPGI_Careers"
  },
  {
    name: "Manulife",
    host: "manulife.wd3.myworkdayjobs.com",
    tenant: "manulife",
    site: "MFCJH_Jobs"
  },
  {
    name: "Fidelity",
    host: "fmr.wd1.myworkdayjobs.com",
    tenant: "fmr",
    site: "FidelityCareers"
  },
  {
    name: "T. Rowe Price",
    host: "troweprice.wd5.myworkdayjobs.com",
    tenant: "troweprice",
    site: "TRowePrice"
  },
  {
    name: "Nasdaq",
    host: "nasdaq.wd1.myworkdayjobs.com",
    tenant: "nasdaq",
    site: "Global_External_Site"
  },
  {
    name: "Morgan Stanley",
    host: "ms.wd5.myworkdayjobs.com",
    tenant: "ms",
    site: "External"
  },
  {
    name: "Bank of America",
    host: "ghr.wd1.myworkdayjobs.com",
    tenant: "ghr",
    site: "lateral-apac"
  },
  {
    name: "Wells Fargo",
    host: "wf.wd1.myworkdayjobs.com",
    tenant: "wf",
    site: "WellsFargoJobs"
  },
  {
    name: "TP ICAP",
    host: "tp.wd107.myworkdayjobs.com",
    tenant: "tp",
    site: "TP-ICAP"
  },
  {
    name: "Ares Management",
    host: "aresmgmt.wd1.myworkdayjobs.com",
    tenant: "aresmgmt",
    site: "External"
  },
  {
    name: "Invesco",
    host: "invesco.wd1.myworkdayjobs.com",
    tenant: "invesco",
    site: "IVZ"
  },
  {
    name: "FTI Consulting",
    host: "fticonsulting.wd108.myworkdayjobs.com",
    tenant: "fticonsulting",
    site: "FTIConsultingCareers"
  },
  {
    name: "Cambridge Associates",
    host: "cambridgeassociates.wd5.myworkdayjobs.com",
    tenant: "cambridgeassociates",
    site: "Handshake"
  },
  {
    name: "Mizuho",
    host: "mizuhogroup.wd102.myworkdayjobs.com",
    tenant: "mizuhogroup",
    site: "External"
  },
  {
    name: "FWD",
    host: "fwd.wd3.myworkdayjobs.com",
    tenant: "fwd",
    site: "FWDcareersite"
  },
  {
    name: "Fidelity International",
    host: "fil.wd3.myworkdayjobs.com",
    tenant: "fil",
    site: "001"
  },
  {
    name: "Orbis",
    host: "vhr-orbis.wd3.myworkdayjobs.com",
    tenant: "vhr-orbis",
    site: "Orbis_Careers"
  },
  {
    name: "CPP Investments",
    host: "cppib.wd10.myworkdayjobs.com",
    tenant: "cppib",
    site: "cppinvestments"
  },
  {
    name: "Wellington Management",
    host: "wellington.wd5.myworkdayjobs.com",
    tenant: "wellington",
    site: "External"
  },
  {
    name: "ING",
    host: "ing.wd3.myworkdayjobs.com",
    tenant: "ing",
    site: "ICSGBLCOR"
  }
];

function listFromEnv(name: string, fallback: string[]) {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function workdaySourcesFromEnv() {
  const value = process.env.WORKDAY_SOURCES;

  if (!value) {
    return defaultWorkdaySources;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [name, host, tenant, site] = item.split("|").map((part) => part.trim());
      return name && host && tenant && site ? { name, host, tenant, site } : null;
    })
    .filter((item): item is (typeof defaultWorkdaySources)[number] => Boolean(item));
}

function makeId(parts: string[]) {
  return crypto
    .createHash("sha256")
    .update(parts.map((part) => part.trim().toLowerCase()).join("|"))
    .digest("hex")
    .slice(0, 32);
}

function normalizedDedupeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(?:hong kong|hk|sar|china)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function jobDedupeKey(job: JobInput) {
  return [job.company, job.title, job.location].map(normalizedDedupeText).join("|");
}

function dedupeFetchedJobs(jobs: JobInput[]) {
  const byKey = new Map<string, JobInput>();

  for (const job of jobs) {
    const key = jobDedupeKey(job);
    const existing = byKey.get(key);

    if (!existing || sortByPostedDateDesc(job, existing) < 0) {
      byKey.set(key, job);
    }
  }

  return Array.from(byKey.values()).sort(sortByPostedDateDesc);
}

function normalizeLocation(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).join(", ") || "Hong Kong";
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "Hong Kong";
}

function looksHongKong(location: string) {
  return /hong kong|hong-kong|hk/i.test(location);
}

function looksFinance(title: string, description = "") {
  const haystack = `${title} ${description}`.toLowerCase();
  return [
    "finance",
    "financial",
    "investment",
    "bank",
    "banking",
    "asset management",
    "wealth",
    "risk",
    "compliance",
    "quant",
    "trading",
    "portfolio",
    "capital markets",
    "private equity",
    "credit"
  ].some((keyword) => haystack.includes(keyword));
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " "
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const normalized = entity.toLowerCase();

    if (normalized.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }

    if (normalized.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }

    return namedEntities[normalized] ?? match;
  });
}

function isInternshipRole(title: string, category = "", description = "") {
  const titleText = title.toLowerCase();
  const titleAndCategory = `${title} ${category}`.toLowerCase();
  const descriptionText = description.toLowerCase();

  const internshipTitleSignals = [
    /\bintern\b/,
    /\binternship\b/,
    /\bsummer internship\b/,
    /\boff[- ]cycle\b/,
    /\bsummer\s+(?:financial\s+)?analyst\b/
  ];

  const internshipDescriptionSignals = [
    /\bas an intern\b/,
    /\binternship program\b/,
    /\bthis internship\b/,
    /\bour [a-z\s-]{0,40}internship\b/,
    /\bsummer internship\b/,
    /\boff[- ]cycle internship\b/,
    /\b10-week internship\b/,
    /\b8-week summer internship\b/
  ];

  const graduateTitleSignals = [
    /\bgraduates?\b/,
    /\bnew grad\b/,
    /\bgraduate programme\b/,
    /\bgraduate program\b/,
    /\blaunch graduate\b/,
    /\btrainee\b/
  ];

  const isExplicitInternshipTitle =
    internshipTitleSignals.some((pattern) => pattern.test(titleAndCategory)) || titleText.includes("summer analyst");

  if (isExplicitInternshipTitle) {
    return true;
  }

  if (graduateTitleSignals.some((pattern) => pattern.test(titleAndCategory))) {
    return false;
  }

  return internshipDescriptionSignals.some((pattern) => pattern.test(descriptionText));
}

function hasSeniorTitleSignal(title: string) {
  return /\b(?:senior|intermediate|manager|director|head|lead|principal|staff|vp|vice president|counsel|specialist|expert|coach|coordinator)\b/i.test(
    title
  );
}

export function hasRequiredExperience(description = "") {
  const haystack = description.toLowerCase();

  if (
    /(?:no|without)\s+(?:prior\s+)?experience\s+(?:is\s+)?required/.test(haystack) ||
    /prior experience .{0,40}not required/.test(haystack)
  ) {
    return false;
  }

  return (
    /\b(?:[1-9]|[1-9]\d)\+?\s*(?:-|to\s*)?\s*(?:[1-9]|[1-9]\d)?\s+years?[\w\s,/+-]{0,80}experience\b/.test(
      haystack
    ) ||
    /\bminimum of\s+(?:[1-9]|[1-9]\d)\s+years?\b/.test(haystack) ||
    /\bat least\s+(?:[1-9]|[1-9]\d)\s+years?\b/.test(haystack)
  );
}

function isEarlyCareerRole(title: string, category = "", description = "") {
  const titleText = title.toLowerCase();
  const titleAndCategory = `${title} ${category}`.toLowerCase();
  const haystack = `${titleAndCategory} ${description}`.toLowerCase();

  const strongEntrySignals = [
    /\bgraduates?\b/,
    /\bnew grad\b/,
    /\bentry level\b/,
    /\btrainee\b/,
    /\bgraduate trainee\b/,
    /\bgraduate trader\b/,
    /\bgraduate quant\b/,
    /\bacademy\b/,
    /\baccountant\b/,
    /\bofficer\b/
  ];

  const seniorSignals = [
    "senior",
    "experienced",
    "manager",
    "director",
    "head of",
    "lead",
    "intermediate",
    "principal",
    "staff",
    "vp",
    "vice president",
    "counsel",
    "specialist",
    "expert",
    "coach",
    "coordinator"
  ];

  const descriptionSignals = [
    /current student/,
    /planning to graduate/,
    /will graduate/,
    /graduating (?:in|between)/,
    /graduation date/,
    /upcoming graduates?/,
    /recent graduates?/,
    /fresh graduates? welcome/,
    /suitable for fresh graduates?/,
    /newest hires/,
    /new traders/,
    /less-experienced/,
    /year-long firmwide educational curriculum/,
    /more interested in how you think and learn than what you currently know/,
    /undergraduate and graduate programs/,
    /new graduates?/
  ];

  const entryTitleTerms = [
    /\banalyst\b/,
    /\bassociate\b/,
    /\bjunior\b/,
    /\bgraduate\b/,
    /\btrainee\b/,
    /\bquantitative researcher\b/,
    /\bquantitative trader\b/,
    /\bquantitative developer\b/,
    /\bgraduate trader\b/,
    /\btrading desk operations engineer\b/,
    /\bsales representative\b/,
    /\bsales development representative\b/,
    /\baccount executive\b/,
    /\btrade operations analyst\b/,
    /\bfinancial reporting accountant\b/
  ];

  const hasTitleSignal = strongEntrySignals.some((pattern) => pattern.test(titleAndCategory));
  const hasDescriptionSignal = descriptionSignals.some((pattern) => pattern.test(haystack));
  const hasEntryTitle = entryTitleTerms.some((pattern) => pattern.test(titleAndCategory));
  const hasExperiencedProfessionalSignal = titleText.includes("experienced professional");
  const hasSeniorSignal = seniorSignals
    .filter((term) => term !== "experienced")
    .some((term) => titleText.includes(term));

  if (isInternshipRole(title, category, description)) {
    return false;
  }

  if (hasExperiencedProfessionalSignal && !(hasTitleSignal || hasDescriptionSignal || hasEntryTitle)) {
    return false;
  }

  return (hasTitleSignal || hasDescriptionSignal || hasEntryTitle) && !hasSeniorSignal && !hasRequiredExperience(haystack);
}

function isRelevantFinanceRole(title: string, category = "", description = "") {
  const titleAndCategory = `${title} ${category}`.toLowerCase();
  const fullText = `${titleAndCategory} ${description}`.toLowerCase();

  const excludedTitleTerms = [
    "recruiter",
    "talent development",
    "facilities",
    "data centre",
    "data center",
    "it operations",
    "infrastructure",
    "cybersecurity",
    "workplace",
    "office manager",
    "human resources",
    "people partner",
    "information technology",
    "it service",
    "service management",
    "technology service",
    "identity and access",
    "user acceptance testing",
    "digital",
    "software",
    "engineer"
  ];

  if (excludedTitleTerms.some((term) => title.toLowerCase().includes(term))) {
    return false;
  }

  const roleTerms = [
    "analyst",
    "trader",
    "trading",
    "investment",
    "investor",
    "asset",
    "portfolio",
    "finance",
    "financial",
    "account",
    "treasury",
    "tax",
    "risk",
    "compliance",
    "audit",
    "controls",
    "capital",
    "credit",
    "sales",
    "business development",
    "operations",
    "settlement",
    "middle office",
    "research",
    "quant",
    "markets",
    "fund",
    "liquidity",
    "payments",
    "aml",
    "institutional",
    "wholesale",
    "otc",
    "dex"
  ];

  const productRole =
    titleAndCategory.includes("product") &&
    ["trading", "financial", "risk", "institutional", "wholesale", "dex", "otc"].some((term) =>
      fullText.includes(term)
    );

  return productRole || roleTerms.some((term) => titleAndCategory.includes(term));
}

function normalizeDescription(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  let decoded = value;
  for (let index = 0; index < 4; index += 1) {
    const next = decodeHtmlEntities(decoded);
    if (next === decoded) {
      break;
    }
    decoded = next;
  }

  const text = decoded
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text || null;
}

type AdzunaJob = {
  id?: string;
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  redirect_url?: string;
  category?: { label?: string };
  description?: string;
  created?: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
};

type AdzunaResponse = {
  results?: AdzunaJob[];
};

type FetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

async function fetchWithTimeout(url: string, init: FetchInit = {}) {
  const timeoutMs = Number.parseInt(process.env.JOB_FETCH_TIMEOUT_MS || "15000", 10);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson<T>(url: string) {
  const response = await fetchWithTimeout(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchText(url: string) {
  const response = await fetchWithTimeout(url, {
    headers: {
      accept: "application/rss+xml, application/xml, text/xml, text/html, text/plain",
      "user-agent": "hk-finance-jobs/1.0"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}`);
  }

  return response.text();
}

async function postJson<T>(url: string, body: unknown) {
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify(body),
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchAdzunaJobs(): Promise<JobInput[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = process.env.ADZUNA_COUNTRY || "hk";

  if (!appId || !appKey) {
    return [];
  }

  const jobsById = new Map<string, JobInput>();

  for (const keyword of financeKeywords) {
    try {
      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: "50",
        what: keyword,
        where: "Hong Kong",
        "content-type": "application/json"
      });

      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`;
      const data = await fetchJson<AdzunaResponse>(url);

      for (const item of data.results ?? []) {
        const title = item.title?.trim();
        const company = item.company?.display_name?.trim() || "Unknown company";
        const location = item.location?.display_name?.trim() || "Hong Kong";
        const applyUrl = item.redirect_url?.trim();
        const description = normalizeDescription(item.description);

        if (
          !title ||
          !applyUrl ||
          !isRelevantFinanceRole(title, item.category?.label ?? "", description ?? "") ||
          !isEarlyCareerRole(title, item.category?.label ?? "", description ?? "")
        ) {
          continue;
        }

        const id = item.id ? `adzuna-${item.id}` : makeId(["adzuna", title, company, location, applyUrl]);

        jobsById.set(id, {
          id,
          title,
          company,
          location,
          source: "Adzuna",
          apply_url: applyUrl,
          description,
          category: item.category?.label ?? null,
          salary_min: item.salary_min ?? null,
          salary_max: item.salary_max ?? null,
          currency: "HKD",
          posted_at: item.created ?? null
        });
      }
    } catch {
      continue;
    }
  }

  return Array.from(jobsById.values());
}

type GreenhouseOffice = {
  name?: string;
  location?: string;
};

type GreenhouseJob = {
  id: number;
  title?: string;
  absolute_url?: string;
  location?: { name?: string };
  offices?: GreenhouseOffice[];
  departments?: Array<{ name?: string }>;
  content?: string;
  first_published?: string;
  updated_at?: string;
};

export async function fetchGreenhouseJobs(): Promise<JobInput[]> {
  const boards = listFromEnv("GREENHOUSE_BOARDS", defaultGreenhouseBoards);

  const jobs: JobInput[] = [];

  for (const board of boards) {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`;
      const data = await fetchJson<{ jobs?: GreenhouseJob[] }>(url);

      for (const item of data.jobs ?? []) {
        const title = item.title?.trim();
        const applyUrl = item.absolute_url?.trim();
        const location = normalizeLocation(item.location?.name ?? item.offices?.map((office) => office.location || office.name));
        const description = normalizeDescription(item.content);
        const category = item.departments?.map((department) => department.name).filter(Boolean).join(", ") || "";

        if (
          !title ||
          !applyUrl ||
          !looksHongKong(location) ||
          !looksFinance(title, description ?? "") ||
          !isRelevantFinanceRole(title, category, description ?? "") ||
          !isEarlyCareerRole(title, category, description ?? "")
        ) {
          continue;
        }

        jobs.push({
          id: makeId(["greenhouse", board, String(item.id)]),
          title,
          company: companyNames[board] ?? board,
          location,
          source: "Greenhouse",
          apply_url: applyUrl,
          description,
          category: category || null,
          salary_min: null,
          salary_max: null,
          currency: null,
          posted_at: item.first_published ?? item.updated_at ?? null
        });
      }
    } catch {
      continue;
    }
  }

  return jobs;
}

type LeverPosting = {
  id: string;
  text?: string;
  hostedUrl?: string;
  applyUrl?: string;
  description?: string;
  descriptionPlain?: string;
  createdAt?: number;
  categories?: {
    team?: string;
    location?: string;
    commitment?: string;
  };
};

export async function fetchLeverJobs(): Promise<JobInput[]> {
  const companies = listFromEnv("LEVER_COMPANIES", defaultLeverCompanies);

  const jobs: JobInput[] = [];

  for (const company of companies) {
    try {
      const url = `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`;
      const data = await fetchJson<LeverPosting[]>(url);

      for (const item of data) {
        const title = item.text?.trim();
        const applyUrl = item.hostedUrl?.trim() || item.applyUrl?.trim();
        const location = normalizeLocation(item.categories?.location);
        const description = normalizeDescription(item.descriptionPlain || item.description);
        const category = item.categories?.team ?? "";

        if (
          !title ||
          !applyUrl ||
          !looksHongKong(location) ||
          !looksFinance(title, description ?? "") ||
          !isRelevantFinanceRole(title, category, description ?? "") ||
          !isEarlyCareerRole(title, category, description ?? "")
        ) {
          continue;
        }

        jobs.push({
          id: makeId(["lever", company, item.id]),
          title,
          company: companyNames[company] ?? company,
          location,
          source: "Lever",
          apply_url: applyUrl,
          description,
          category: category || null,
          salary_min: null,
          salary_max: null,
          currency: null,
          posted_at: item.createdAt ? new Date(item.createdAt).toISOString() : null
        });
      }
    } catch {
      continue;
    }
  }

  return jobs;
}

type AshbyPosting = {
  id: string;
  title?: string;
  department?: string;
  team?: string;
  employmentType?: string;
  location?: string;
  secondaryLocations?: Array<{ location?: string }>;
  jobUrl?: string;
  applyUrl?: string;
  descriptionHtml?: string;
  publishedAt?: string;
};

export async function fetchAshbyJobs(): Promise<JobInput[]> {
  const boards = listFromEnv("ASHBY_BOARDS", defaultAshbyBoards);

  const jobs: JobInput[] = [];

  for (const board of boards) {
    try {
      const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}`;
      const data = await fetchJson<{ jobs?: AshbyPosting[] }>(url);

      for (const item of data.jobs ?? []) {
        const title = item.title?.trim();
        const applyUrl = item.jobUrl?.trim() || item.applyUrl?.trim();
        const location = normalizeLocation([
          item.location,
          ...(item.secondaryLocations?.map((secondary) => secondary.location) ?? [])
        ].filter(Boolean));
        const description = normalizeDescription(item.descriptionHtml);
        const category = item.department || item.team || "";

        if (
          !title ||
          !applyUrl ||
          item.employmentType !== "FullTime" ||
          !looksHongKong(location) ||
          !looksFinance(title, description ?? "") ||
          !isRelevantFinanceRole(title, category, description ?? "") ||
          !isEarlyCareerRole(title, category, description ?? "")
        ) {
          continue;
        }

        jobs.push({
          id: makeId(["ashby", board, item.id]),
          title,
          company: companyNames[board] ?? board,
          location,
          source: "Ashby",
          apply_url: applyUrl,
          description,
          category: category || null,
          salary_min: null,
          salary_max: null,
          currency: null,
          posted_at: item.publishedAt ?? null
        });
      }
    } catch {
      continue;
    }
  }

  return jobs;
}

type MuseJob = {
  id: number;
  name?: string;
  contents?: string;
  publication_date?: string;
  refs?: {
    landing_page?: string;
  };
  company?: {
    name?: string;
  };
  locations?: Array<{ name?: string }>;
  categories?: Array<{ name?: string }>;
  levels?: Array<{ name?: string; short_name?: string }>;
};

type MuseResponse = {
  page_count?: number;
  results?: MuseJob[];
};

export async function fetchMuseJobs(): Promise<JobInput[]> {
  const jobsById = new Map<string, JobInput>();
  const pageLimit = Number.parseInt(process.env.MUSE_PAGE_LIMIT || "8", 10);

  for (const keyword of museKeywords) {
    for (let page = 1; page <= pageLimit; page += 1) {
      try {
        const params = new URLSearchParams({
          page: String(page),
          location: "Hong Kong",
          descending: "true",
          q: keyword
        });
        const url = `https://www.themuse.com/api/public/jobs?${params.toString()}`;
        const data = await fetchJson<MuseResponse>(url);

        for (const item of data.results ?? []) {
          const title = item.name?.trim();
          const company = item.company?.name?.trim() || "Unknown company";
          const location = normalizeLocation(item.locations?.map((entry) => entry.name).filter(Boolean));
          const applyUrl = item.refs?.landing_page?.trim();
          const description = normalizeDescription(item.contents);
          const category = item.categories?.map((entry) => entry.name).filter(Boolean).join(", ") || "";
          const level = item.levels?.map((entry) => entry.name).filter(Boolean).join(", ") || "";

          if (
            !title ||
            !applyUrl ||
            !looksHongKong(location) ||
            !looksFinance(title, description ?? "") ||
            !isRelevantFinanceRole(title, category, description ?? "") ||
            !isEarlyCareerRole(title, `${category} ${level}`, description ?? "")
          ) {
            continue;
          }

          const id = makeId(["muse", String(item.id)]);
          jobsById.set(id, {
            id,
            title,
            company,
            location,
            source: "The Muse",
            apply_url: applyUrl,
            description,
            category: category || level || null,
            salary_min: null,
            salary_max: null,
            currency: null,
            posted_at: item.publication_date ?? null
          });
        }

        if (data.page_count && page >= data.page_count) {
          break;
        }
      } catch {
        continue;
      }
    }
  }

  return Array.from(jobsById.values());
}

type CuratedArticle = {
  title: string;
  url: string;
  html: string;
  text: string;
  publishedAt: string | null;
};

type WeChatQueryArticle = {
  biz_id?: string | number;
  biz_name?: string;
  title?: string;
  desc?: string;
  created?: string;
  content?: string;
};

type WeChatQueryResponse = {
  data?: WeChatQueryArticle[];
  err?: string;
};

type SogouWeChatResult = {
  title: string;
  summary: string;
  account: string;
  publishedAt: string | null;
  link: string;
};

type RssItem = {
  title: string;
  link: string;
  publishedAt: string | null;
  html: string;
};

function xmlTagValue(value: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = value.match(pattern)?.[1];

  if (!match) {
    return "";
  }

  return decodeHtmlEntities(match.replace(/^<!\[CDATA\[|\]\]>$/g, "").trim());
}

function parseDateString(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function parseRssItems(xml: string) {
  const items: RssItem[] = [];
  const itemMatches = xml.matchAll(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>|<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi);

  for (const match of itemMatches) {
    const item = match[0];
    const title = normalizeDescription(xmlTagValue(item, "title")) ?? "";
    const linkFromTag = xmlTagValue(item, "link");
    const linkFromAttribute = item.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ?? "";
    const link = decodeHtmlEntities(linkFromTag || linkFromAttribute);
    const publishedAt = parseDateString(
      xmlTagValue(item, "pubDate") || xmlTagValue(item, "published") || xmlTagValue(item, "updated")
    );
    const html = [
      xmlTagValue(item, "content:encoded"),
      xmlTagValue(item, "content"),
      xmlTagValue(item, "description"),
      xmlTagValue(item, "summary")
    ]
      .filter(Boolean)
      .join("\n");

    if (title && link) {
      items.push({ title, link, publishedAt, html });
    }
  }

  return items;
}

function extractWechatPublishedAt(html: string) {
  const epochSeconds = html.match(/\bvar\s+ct\s*=\s*["'](\d{10})["']/)?.[1];
  if (epochSeconds) {
    return new Date(Number.parseInt(epochSeconds, 10) * 1000).toISOString();
  }

  const metaTime =
    html.match(/property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/name=["']publishdate["'][^>]+content=["']([^"']+)["']/i)?.[1];

  return parseDateString(metaTime);
}

function extractWechatTitle(html: string, fallback: string) {
  const jsonTitle = html.match(/\bvar\s+msg_title\s*=\s*["']([^"']+)["']/)?.[1];
  const metaTitle =
    html.match(/property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];

  return normalizeDescription(jsonTitle || metaTitle || fallback) ?? fallback;
}

function extractExternalLinks(html: string) {
  const urls = new Set<string>();

  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    urls.add(decodeHtmlEntities(match[1]));
  }

  for (const match of html.matchAll(/https?:\/\/[^\s"'<>）)]+/gi)) {
    urls.add(decodeHtmlEntities(match[0]));
  }

  return Array.from(urls)
    .map((url) => url.replace(/&amp;/g, "&").trim())
    .filter((url) => {
      if (!/^https?:\/\//i.test(url)) {
        return false;
      }

      try {
        const host = new URL(url).hostname;
        return !/(^|\.)weixin\.qq\.com$|(^|\.)qq\.com$|(^|\.)wechat\.com$/i.test(host);
      } catch {
        return false;
      }
    });
}

function chooseApplyUrl(links: string[], context: string) {
  const contextUrls = Array.from(context.matchAll(/https?:\/\/[^\s"'<>）)]+/gi), (match) => match[0]);
  const candidates = [...contextUrls, ...links].map((url) => decodeHtmlEntities(url).trim());

  return (
    candidates.find((url) =>
      /apply|career|jobs?|position|recruit|workdayjobs|greenhouse|lever|ashbyhq|smartrecruiters|taleo|successfactors|myworkdayjobs/i.test(
        url
      )
    ) ??
    candidates[0] ??
    null
  );
}

function labeledValue(text: string, labels: string[]) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*[:：]\\s*([^\\n]+)`, "i"));

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function inferCompanyAndTitleFromHeading(heading: string) {
  const bracketed = heading.match(/^[【\[]([^】\]]+)[】\]]\s*(.+)$/);
  if (bracketed) {
    return { company: bracketed[1].trim(), title: bracketed[2].trim() };
  }

  const separated = heading.match(/^(.{2,60}?)(?:\s+[-|｜:：]\s+)(.{4,120})$/);
  if (separated) {
    return { company: separated[1].trim(), title: separated[2].trim() };
  }

  return { company: null, title: heading.trim() };
}

function articleBlocks(text: string) {
  return text
    .split(/\n{2,}|(?=\n?\s*(?:公司|Company)\s*[:：])|(?=\n?\s*(?:岗位|职位|Role|Position|Job Title)\s*[:：])/i)
    .map((block) => block.trim())
    .filter((block) => block.length > 20);
}

function buildCuratedJob(article: CuratedArticle, block: string, links: string[], index: number) {
  const titleFromLabel = labeledValue(block, ["岗位", "职位", "岗位名称", "职位名称", "Role", "Position", "Job Title", "Title"]);
  const heading = block.split("\n").find((line) => /analyst|associate|graduate|trainee|trader|finance|risk|compliance|bank/i.test(line));
  const inferred = inferCompanyAndTitleFromHeading(titleFromLabel || heading || article.title);
  const title = (titleFromLabel || inferred.title)?.replace(/\s+/g, " ").trim();
  const company = (
    labeledValue(block, ["公司", "雇主", "机构", "Company", "Employer", "Firm"]) ||
    inferred.company ||
    labeledValue(article.text, ["公司", "Company"])
  )
    ?.replace(/\s+/g, " ")
    .trim();
  const location = (
    labeledValue(block, ["地点", "工作地点", "Location", "Base"]) ||
    (looksHongKong(block) ? "Hong Kong" : null)
  )?.trim();
  const applyUrl = chooseApplyUrl(links, block);
  const description = normalizeDescription(block);

  if (
    !title ||
    !company ||
    !location ||
    !applyUrl ||
    !article.publishedAt ||
    !looksHongKong(location) ||
    !isPostedOnOrAfterCutoff(article.publishedAt) ||
    !looksFinance(title, description ?? "") ||
    !isRelevantFinanceRole(title, "", description ?? "") ||
    !isEarlyCareerRole(title, "", description ?? "")
  ) {
    return null;
  }

  return {
    id: makeId(["curated-article", article.url, company, title, String(index)]),
    title,
    company,
    location,
    source: "Curated",
    apply_url: applyUrl,
    description,
    category: null,
    salary_min: null,
    salary_max: null,
    currency: null,
    posted_at: article.publishedAt
  } satisfies JobInput;
}

function extractCuratedJobsFromArticle(article: CuratedArticle) {
  const links = extractExternalLinks(article.html);
  const jobs: JobInput[] = [];
  const blocks = articleBlocks(article.text);

  for (const [index, block] of blocks.entries()) {
    const job = buildCuratedJob(article, block, links, index);
    if (job) {
      jobs.push(job);
    }
  }

  if (!jobs.length) {
    const fallbackJob = buildCuratedJob(article, article.text, links, 0);
    if (fallbackJob) {
      jobs.push(fallbackJob);
    }
  }

  return jobs;
}

async function fetchCuratedArticle(url: string, fallbackTitle = "") {
  const html = await fetchText(url);
  const text = normalizeDescription(html) ?? "";
  const title = extractWechatTitle(html, fallbackTitle);
  const publishedAt = extractWechatPublishedAt(html) ?? null;

  return { title, url, html, text, publishedAt } satisfies CuratedArticle;
}

async function fetchWeChatQueryArticles() {
  const baseUrl = process.env.WECHAT2RSS_API_BASE || "https://wechat2rss.xlab.app/api/query";
  const token = process.env.WECHAT2RSS_TOKEN;
  const bizIds = listFromEnv("WECHAT_BIZ_IDS", []);

  if (!token || !bizIds.length) {
    return [];
  }

  const after = minPostedDate.replace(/-/g, "");
  const articles: CuratedArticle[] = [];

  for (const bizId of bizIds) {
    const params = new URLSearchParams({
      k: token,
      bid: bizId,
      after,
      content: "1"
    });

    const url = `${baseUrl}?${params.toString()}`;
    const response = await fetchJson<WeChatQueryResponse>(url);

    for (const item of response.data ?? []) {
      const publishedAt = parseDateString(item.created);
      const title = normalizeDescription(item.title ?? "") ?? "";
      const html = item.content ?? item.desc ?? "";

      if (!title || !publishedAt || !isPostedOnOrAfterCutoff(publishedAt)) {
        continue;
      }

      articles.push({
        title,
        url: `wechat2rss://${String(item.biz_id ?? bizId)}/${encodeURIComponent(title)}`,
        html,
        text: normalizeDescription(html) ?? item.desc ?? "",
        publishedAt
      });
    }
  }

  return articles;
}

function sogouSearchUrl(query: string) {
  return `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(query)}`;
}

function parseSogouSearchResults(html: string) {
  const results: SogouWeChatResult[] = [];
  const cardRegex = /<div class="txt-box">[\s\S]*?<h3>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<p class="txt-info"[^>]*>([\s\S]*?)<\/p>[\s\S]*?<div class="s-p">[\s\S]*?<span class="all-time-y2">([\s\S]*?)<\/span>[\s\S]*?<span class="s2">[\s\S]*?timeConvert\('(\d+)'\)/gi;

  for (const match of html.matchAll(cardRegex)) {
    const link = match[1].replace(/&amp;/g, "&");
    const title = normalizeDescription(match[2].replace(/<[^>]+>/g, " ")) ?? "";
    const summary = normalizeDescription(match[3].replace(/<[^>]+>/g, " ")) ?? "";
    const account = normalizeDescription(match[4].replace(/<[^>]+>/g, " ")) ?? "";
    const publishedAt = new Date(Number.parseInt(match[5], 10) * 1000).toISOString();

    if (title && account) {
      results.push({ title, summary, account, publishedAt, link });
    }
  }

  return results;
}

function isCuratedWeChatJob(title: string, summary: string, account: string) {
  const text = `${title} ${summary} ${account}`;
  return (
    looksHongKong(text) &&
    looksFinance(text) &&
    !/\bintern(ship)?\b|summer internship|off[- ]cycle/i.test(text) &&
    !/\bsenior\b|\bmanager\b|\bdirector\b|\bvice president\b|\bvp\b/i.test(text)
  );
}

async function fetchSogouWeChatJobs(): Promise<JobInput[]> {
  const queries = listFromEnv("SOGOU_WECHAT_QUERIES", [
    "香港 金融 招聘",
    "香港 校招 金融",
    "香港 Graduate Program",
    "香港 Analyst 招聘",
    "香港 Associate 招聘",
    "香港 财务 招聘",
    "香港 会计 招聘",
    "香港 审计 招聘",
    "香港 反洗钱 招聘",
    "香港 资管 招聘",
    "香港 资金 招聘",
    "香港 Treasury 招聘",
    "香港 Accounting 招聘",
    "香港 Officer 招聘",
    "香港 证券 招聘",
    "香港 投行 招聘",
    "香港 风控 招聘",
    "简职HK",
    "香港校招",
    "求职香港",
    "Navigator Advisory",
    "职问",
    "CaseMock",
    "职场 Bonus",
    "中银香港招聘",
    "中信银行国际招聘",
    "招商永隆微服务",
    "华泰证券招聘",
    "富途招聘"
  ]);

  const jobs: JobInput[] = [];

  for (const query of queries) {
    try {
      const html = await fetchText(sogouSearchUrl(query));
      if (/antispider|verify|captcha/i.test(html)) {
        continue;
      }

      const results = parseSogouSearchResults(html).slice(0, 8);
      for (const result of results) {
        if (!isCuratedWeChatJob(result.title, result.summary, result.account)) {
          continue;
        }

        jobs.push({
          id: makeId(["sogou-wechat", query, result.account, result.title]),
          title: result.title,
          company: result.account,
          location: "Hong Kong",
          source: "Curated",
          apply_url: sogouSearchUrl(query),
          description: result.summary || null,
          category: query,
          salary_min: null,
          salary_max: null,
          currency: null,
          posted_at: result.publishedAt
        });
      }
    } catch {
      continue;
    }
  }

  return jobs;
}

async function fetchCuratedRssArticles(feedUrl: string) {
  const xml = await fetchText(feedUrl);
  const articles: CuratedArticle[] = [];

  for (const item of parseRssItems(xml)) {
    const resolvedLink = (() => {
      try {
        return new URL(item.link, feedUrl).toString();
      } catch {
        return item.link;
      }
    })();
    const publishedAt = item.publishedAt;

    if (!publishedAt || !isPostedOnOrAfterCutoff(publishedAt)) {
      continue;
    }

    if (item.html) {
      articles.push({
        title: item.title,
        url: resolvedLink,
        html: item.html,
        text: normalizeDescription(item.html) ?? "",
        publishedAt
      });
      continue;
    }

    try {
      const article = await fetchCuratedArticle(resolvedLink, item.title);
      articles.push({ ...article, publishedAt: article.publishedAt ?? publishedAt });
    } catch {
      continue;
    }
  }

  return articles;
}

export async function fetchCuratedArticleJobs(): Promise<JobInput[]> {
  const feedUrls = listFromEnv("CURATED_ARTICLE_RSS_FEEDS", []);
  const articleUrls = listFromEnv("CURATED_ARTICLE_URLS", []);
  const wechatQueryEnabled = Boolean(process.env.WECHAT2RSS_TOKEN && listFromEnv("WECHAT_BIZ_IDS", []).length);

  if (!feedUrls.length && !articleUrls.length && !wechatQueryEnabled) {
    return [];
  }

  const articleResults = await Promise.allSettled([
    ...(wechatQueryEnabled ? [fetchWeChatQueryArticles()] : []),
    ...feedUrls.map((url) => fetchCuratedRssArticles(url)),
    ...articleUrls.map(async (url) => [await fetchCuratedArticle(url)])
  ]);
  const jobs = new Map<string, JobInput>();

  for (const result of articleResults) {
    if (result.status !== "fulfilled") {
      continue;
    }

    for (const article of result.value) {
      for (const job of extractCuratedJobsFromArticle(article)) {
        jobs.set(job.id, job);
      }
    }
  }

  return Array.from(jobs.values());
}

type WorkdaySource = (typeof defaultWorkdaySources)[number];

type WorkdayPosting = {
  title?: string;
  externalPath?: string;
  locationsText?: string;
  location?: string;
  postedOn?: string;
  startDate?: string;
  jobReqId?: string;
  bulletFields?: Array<{
    name?: string;
    field?: string;
    value?: string;
  }>;
};

type WorkdaySearchResponse = {
  total?: number;
  jobPostings?: WorkdayPosting[];
};

type WorkdayJobDetail = {
  jobPostingInfo?: {
    title?: string;
    jobDescription?: string;
    externalUrl?: string;
    jobReqId?: string;
    postedOn?: string;
    startDate?: string;
    location?: string;
    locationsText?: string;
    additionalLocations?: Array<string | { location?: string }>;
  };
};

function parseWorkdayPostedOn(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const text = value.trim();
  const today = new Date();
  const relativeDate = new Date(today);

  if (/posted\s+today/i.test(text)) {
    return today.toISOString();
  }

  if (/posted\s+yesterday/i.test(text)) {
    relativeDate.setDate(relativeDate.getDate() - 1);
    return relativeDate.toISOString();
  }

  const daysAgo = text.match(/posted\s+(\d+)\+?\s+days?\s+ago/i)?.[1];
  if (daysAgo) {
    relativeDate.setDate(relativeDate.getDate() - Number.parseInt(daysAgo, 10));
    return relativeDate.toISOString();
  }

  const weeksAgo = text.match(/posted\s+(\d+)\+?\s+weeks?\s+ago/i)?.[1];
  if (weeksAgo) {
    relativeDate.setDate(relativeDate.getDate() - Number.parseInt(weeksAgo, 10) * 7);
    return relativeDate.toISOString();
  }

  const dateText = text.replace(/^posted\s+(?:on\s+)?/i, "");
  const parsed = new Date(dateText);

  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function workdayJobUrl(source: WorkdaySource, externalPath: string) {
  return `https://${source.host}/en-US/${source.site}${externalPath}`;
}

function workdayLocation(posting: WorkdayPosting, detail?: WorkdayJobDetail) {
  const detailInfo = detail?.jobPostingInfo;
  const extraLocations = detailInfo?.additionalLocations?.map((location) =>
    typeof location === "string" ? location : location.location
  );

  return normalizeLocation([
    posting.locationsText,
    posting.location,
    detailInfo?.locationsText,
    detailInfo?.location,
    ...(extraLocations ?? [])
  ].filter(Boolean));
}

function workdayCategory(posting: WorkdayPosting) {
  return (
    posting.bulletFields
      ?.map((field) => field.value || field.field || field.name)
      .filter(Boolean)
      .join(", ") || ""
  );
}

function workdayHasHongKongSignal(posting: WorkdayPosting, detail?: WorkdayJobDetail) {
  const detailInfo = detail?.jobPostingInfo;
  const extraLocations = detailInfo?.additionalLocations?.map((location) =>
    typeof location === "string" ? location : location.location
  );
  const text = [
    posting.locationsText,
    posting.location,
    detailInfo?.locationsText,
    detailInfo?.location,
    ...(extraLocations ?? [])
  ]
    .filter(Boolean)
    .join(" ");

  return looksHongKong(text) || (!detail && /^\d+\s+locations?$/i.test(posting.locationsText ?? ""));
}

function looksMacauBased(location: string) {
  return /^macau\b/i.test(location);
}

function isPromisingWorkdayPosting(posting: WorkdayPosting) {
  const title = posting.title?.trim() ?? "";
  const category = workdayCategory(posting);
  const postedAt = parseWorkdayPostedOn(posting.postedOn ?? posting.startDate);

  return (
    Boolean(title && posting.externalPath) &&
    workdayHasHongKongSignal(posting) &&
    isPostedOnOrAfterCutoff(postedAt) &&
    !hasSeniorTitleSignal(title) &&
    !isInternshipRole(title, category) &&
    isRelevantFinanceRole(title, category) &&
    isEarlyCareerRole(title, category)
  );
}

async function fetchWorkdayDetail(source: WorkdaySource, externalPath: string) {
  const url = `https://${source.host}/wday/cxs/${encodeURIComponent(source.tenant)}/${encodeURIComponent(
    source.site
  )}${externalPath}`;

  return fetchJson<WorkdayJobDetail>(url);
}

async function fetchWorkdaySourceJobs(source: WorkdaySource) {
  const jobs = new Map<string, JobInput>();
  const candidates = new Map<string, WorkdayPosting>();
  const searchTerms = listFromEnv("WORKDAY_SEARCH_TERMS", workdaySearchTerms);
  const pageLimit = Number.parseInt(process.env.WORKDAY_PAGE_LIMIT || "8", 10);
  const detailLimit = Number.parseInt(process.env.WORKDAY_DETAIL_LIMIT || "180", 10);
  const searchUrl = `https://${source.host}/wday/cxs/${encodeURIComponent(source.tenant)}/${encodeURIComponent(
    source.site
  )}/jobs`;

  for (const searchText of searchTerms) {
    for (let page = 0; page < pageLimit; page += 1) {
      const offset = page * 20;
      try {
        const data = await postJson<WorkdaySearchResponse>(searchUrl, {
          appliedFacets: {},
          limit: 20,
          offset,
          searchText
        });

        for (const posting of data.jobPostings ?? []) {
          if (posting.externalPath && isPromisingWorkdayPosting(posting)) {
            candidates.set(posting.externalPath, posting);
          }
        }

        if (!data.total || offset + 20 >= data.total) {
          break;
        }
      } catch {
        break;
      }
    }
  }

  for (const posting of Array.from(candidates.values()).slice(0, detailLimit)) {
    if (!posting.externalPath) {
      continue;
    }

    let detail: WorkdayJobDetail | null = null;
    try {
      detail = await fetchWorkdayDetail(source, posting.externalPath);
    } catch {
      continue;
    }
    const detailInfo = detail?.jobPostingInfo;
    const title = (detailInfo?.title || posting.title)?.trim();
    const applyUrl = detailInfo?.externalUrl?.trim() || workdayJobUrl(source, posting.externalPath);
    const location = workdayLocation(posting, detail);
    const description = normalizeDescription(detailInfo?.jobDescription);
    const category = workdayCategory(posting);
    const postedAt = parseWorkdayPostedOn(detailInfo?.postedOn ?? posting.postedOn ?? detailInfo?.startDate ?? posting.startDate);

    if (
      !title ||
      !applyUrl ||
      !workdayHasHongKongSignal(posting, detail) ||
      looksMacauBased(location) ||
      !isPostedOnOrAfterCutoff(postedAt) ||
      !isRelevantFinanceRole(title, category, description ?? "") ||
      !isEarlyCareerRole(title, category, description ?? "")
    ) {
      continue;
    }

    const id = makeId(["workday", source.name, detailInfo?.jobReqId || posting.jobReqId || posting.externalPath]);
    jobs.set(id, {
      id,
      title,
      company: source.name,
      location,
      source: "Workday",
      apply_url: applyUrl,
      description,
      category: category || null,
      salary_min: null,
      salary_max: null,
      currency: null,
      posted_at: postedAt
    });
  }

  return Array.from(jobs.values());
}

export async function fetchWorkdayJobs(): Promise<JobInput[]> {
  const resultSets = await Promise.allSettled(workdaySourcesFromEnv().map((source) => fetchWorkdaySourceJobs(source)));
  const jobs = new Map<string, JobInput>();

  for (const result of resultSets) {
    if (result.status !== "fulfilled") {
      continue;
    }

    for (const job of result.value) {
      jobs.set(job.id, job);
    }
  }

  return Array.from(jobs.values());
}

export async function fetchAllJobs() {
  const resultSets = await Promise.allSettled([
    fetchAdzunaJobs(),
    fetchGreenhouseJobs(),
    fetchLeverJobs(),
    fetchAshbyJobs(),
    fetchMuseJobs(),
    fetchSogouWeChatJobs(),
    fetchCuratedArticleJobs(),
    fetchWorkdayJobs()
  ]);

  const jobs = new Map<string, JobInput>();
  const errors: string[] = [];

  for (const result of resultSets) {
    if (result.status === "fulfilled") {
      for (const job of result.value) {
        jobs.set(job.id, job);
      }
    } else {
      errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
    }
  }

  return {
    jobs: dedupeFetchedJobs(Array.from(jobs.values()).filter((job) => isPostedOnOrAfterCutoff(job.posted_at))),
    errors
  };
}
