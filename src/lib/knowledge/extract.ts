import { HttpError } from "@/lib/api";

export const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_TEXT_CHARS = 60_000; // same limit as the knowledge entry itself

export type Extracted = { text: string; pages?: number; truncated: boolean; format: string };

function clean(raw: string) {
  return raw
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripHtml(html: string) {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ");
}

/** Reads the text out of an uploaded file. Supports PDF, Word (.docx), Markdown, text, CSV and HTML. */
export async function extractFromFile(name: string, bytes: Uint8Array): Promise<Extracted> {
  if (bytes.byteLength > MAX_FILE_BYTES) throw new HttpError("That file is too large. The limit is 8 MB.", 413);
  const ext = (name.split(".").pop() ?? "").toLowerCase();

  let text = "";
  let pages: number | undefined;

  if (ext === "pdf") {
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(bytes);
      const out = await extractText(pdf, { mergePages: true });
      text = Array.isArray(out.text) ? out.text.join("\n\n") : out.text;
      pages = out.totalPages;
    } catch {
      throw new HttpError("We couldn't open that PDF. It may be damaged or password-protected.", 422);
    }
  } else if (ext === "docx") {
    try {
      const mammoth = await import("mammoth");
      const out = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      text = out.value;
    } catch {
      throw new HttpError("We couldn't open that Word file. Try saving it again as .docx or as a PDF.", 422);
    }
  } else if (ext === "doc") {
    throw new HttpError("Old .doc files aren't supported. Please save the file as .docx or PDF and try again.", 415);
  } else if (["md", "markdown", "txt", "csv", "tsv", "text"].includes(ext)) {
    text = new TextDecoder("utf-8").decode(bytes);
  } else if (["html", "htm"].includes(ext)) {
    text = stripHtml(new TextDecoder("utf-8").decode(bytes));
  } else {
    throw new HttpError("That file type isn't supported. Use PDF, Word (.docx), Markdown, text, CSV or HTML.", 415);
  }

  text = clean(text);
  if (!text) {
    throw new HttpError(
      ext === "pdf"
        ? "We couldn't find any text in that PDF. If it's a scan or a photo of a page, it has no selectable text yet. Try a PDF that was exported from a document."
        : "We couldn't find any text in that file.",
      422,
    );
  }

  let truncated = false;
  if (text.length > MAX_TEXT_CHARS) {
    truncated = true;
    const cut = text.slice(0, MAX_TEXT_CHARS);
    const lastBreak = cut.lastIndexOf("\n\n");
    text = (lastBreak > MAX_TEXT_CHARS * 0.7 ? cut.slice(0, lastBreak) : cut).trim();
  }
  return { text, pages, truncated, format: ext };
}
