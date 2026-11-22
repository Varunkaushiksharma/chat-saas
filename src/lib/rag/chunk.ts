// Split text into ~800 character chunks on paragraph/sentence boundaries.
export function chunkText(text: string, maxLen = 800): string[] {
  const paragraphs = text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const p of paragraphs) {
    if (p.length > maxLen) {
      push();
      // long paragraph: split by sentences
      for (const s of p.split(/(?<=[.!?])\s+/)) {
        if ((current + " " + s).length > maxLen) push();
        current += (current ? " " : "") + s;
      }
      push();
      continue;
    }
    if ((current + "\n\n" + p).length > maxLen) push();
    current += (current ? "\n\n" : "") + p;
  }
  push();
  return chunks;
}
