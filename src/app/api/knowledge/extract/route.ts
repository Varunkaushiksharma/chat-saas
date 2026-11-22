import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { extractFromFile, MAX_FILE_BYTES } from "@/lib/knowledge/extract";
import { rateLimit } from "@/lib/ratelimit";

// Reads the text out of an uploaded document and returns it for review.
// Nothing is saved here: the dashboard shows the text, you edit it, then add it as knowledge.
export async function POST(req: Request) {
  return handle(async () => {
    const { user } = await requireUser();
    if (!rateLimit(`extract:${user.id}`, 20, 60_000)) throw new HttpError("Slow down a little, then try again.", 429);

    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_FILE_BYTES + 1024 * 64) throw new HttpError("That file is too large. The limit is 4 MB.", 413);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new HttpError("Choose a file to upload.");
    if (file.size === 0) throw new HttpError("That file is empty.");

    const out = await extractFromFile(file.name, new Uint8Array(await file.arrayBuffer()));
    const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 120) || "Document";
    return NextResponse.json({ title, ...out, chars: out.text.length });
  });
}
