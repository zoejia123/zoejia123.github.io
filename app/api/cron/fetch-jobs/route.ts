import { NextResponse } from "next/server";
import { fetchAllJobs } from "@/lib/job-fetchers";
import { upsertJobs } from "@/lib/jobs-store";
import { hasSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured for persistent refresh" },
      { status: 503 }
    );
  }

  const { jobs, errors } = await fetchAllJobs();
  const result = await upsertJobs(jobs);

  return NextResponse.json({
    ok: true,
    imported: result.count,
    retainedPreviousJobs: true,
    errors
  });
}
