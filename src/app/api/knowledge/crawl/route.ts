import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { crawlSite, CrawlError } from "@/lib/knowledge/crawl";
import { rateLimit } from "@/lib/ratelimit";

// Reading a whole website can take a while (it fetches up to ~30 pages)
export const maxDuration = 60;

const schema = z.object({ url: z.string().trim().min(3, "Enter your website address").max(300) });

// Finds and reads the public pages of a website. Nothing is saved here: the dashboard shows the pages,
// the user ticks what to keep, and only then is anything added as knowledge.
export async function POST(req: Request) {
  return handle(async () => {
    const { url } = schema.parse(await req.json());
    const { user } = await requireUser();
    if (!rateLimit(`crawl:${user.id}`, 6, 10 * 60_000)) {
      throw new HttpError("You've read several websites in a short time. Please wait a few minutes and try again.", 429);
    }
    try {
      const result = await crawlSite(url);
      return NextResponse.json(result);
    } catch (e) {
      if (e instanceof CrawlError) throw new HttpError(e.message, 422);
      throw e;
    }
  });
}
