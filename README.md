# 66offer Hong Kong Finance Jobs

A tiny public Next.js page that shows a daily refreshed list of non-internship, early-career Hong Kong finance roles with direct Apply links.

## What It Does

- Shows role, company, location, source, Apply link, and expandable JD text.
- Filters out internships and senior roles.
- Prioritizes graduate programs, trainee roles, junior roles, analyst/associate roles, and entry-level quant/trading/finance roles.
- Keeps previously found jobs instead of replacing the page on each refresh.
- Shows only jobs posted on or after 2026-07-01.
- Sorts all displayed jobs by source posting time from newest to oldest.
- Tries to find 30+ fresh matching roles on each daily refresh, while keeping strict no-internship and early-career filters.
- Stores normalized jobs in Supabase.
- Includes a bundled `data/jobs.json` snapshot so the page works before Supabase is configured.
- Supports Adzuna when keys are provided.
- Supplements public Greenhouse, Lever, Ashby, The Muse, finance-focused Workday job boards, and optional curated article/RSS sources.

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add these values:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
ADZUNA_COUNTRY=hk
CRON_SECRET=choose-a-long-random-string
```

Optional ATS sources:

```bash
GREENHOUSE_BOARDS=point72,blackrock
LEVER_COMPANIES=animocabrands,ambergroup,crypto
ASHBY_BOARDS=airwallex,elliptic
WORKDAY_SEARCH_TERMS=Hong Kong
WORKDAY_PAGE_LIMIT=4
WORKDAY_DETAIL_LIMIT=90
JOB_FETCH_TIMEOUT_MS=10000
CURATED_ARTICLE_RSS_FEEDS=
CURATED_ARTICLE_URLS=
WECHAT2RSS_API_BASE=
WECHAT2RSS_TOKEN=
WECHAT_BIZ_IDS=
```

Board/company names must match the public ATS slug used by that company.
The bundled snapshot currently uses these public sources by default:

```bash
GREENHOUSE_BOARDS=point72,janestreet,jumptrading,towerresearchcapital,imc,flowtraders,ripple,okx
LEVER_COMPANIES=animocabrands,ambergroup,crypto
ASHBY_BOARDS=airwallex,elliptic
WORKDAY_SOURCES=Barclays|barclays.wd3.myworkdayjobs.com|barclays|External_Career_Site_Barclays,...
```

Leave `WORKDAY_SOURCES` empty to use the bundled finance-focused source list. To override it, provide comma-separated entries in the `Company|host|tenant|site` format.
You can also add curated public-account/article inputs with `CURATED_ARTICLE_RSS_FEEDS` or `CURATED_ARTICLE_URLS`; the page will only surface items that resolve to a real Hong Kong finance role with an Apply link.
If you have an authenticated `wechat2rss` deployment, set `WECHAT2RSS_API_BASE`, `WECHAT2RSS_TOKEN`, and `WECHAT_BIZ_IDS` to pull公众号文章 by `bizid` and run them through the same job extraction pipeline.

Suggested WeChat source list for this project:

```bash
WECHAT_BIZ_IDS=gpqcareer,HKCampusRecruitment,求职香港,Navigator Advisory,职问,CaseMock,ZhiChangHongLi,中银香港招聘,中信银行国际招聘,招商永隆微服务,华泰证券招聘,富途招聘
```

## Local Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

To refresh the bundled job snapshot:

```bash
npm run refresh-jobs
```

To import jobs locally:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/fetch-jobs
```

## Deploy

Deploy this folder to Vercel for the primary live app, and publish the generated `docs/` mirror to GitHub Pages for a China-friendlier public URL.

The mirror is built with:

```bash
npm run refresh-jobs
npm run build-pages-mirror
```

The included GitHub Actions workflow refreshes the snapshot and rebuilds the mirror every day at 06:00 Hong Kong time, then pushes the updated `data/jobs.json` and `docs/` files back to the repository.

## Notes

LinkedIn is intentionally not used as a background scraping source. Use official job APIs, public ATS feeds, curated article feeds, and source Apply links instead.
