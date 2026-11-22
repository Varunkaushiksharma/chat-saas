// What a bot needs to know to answer customers well, grouped into guided sections.
// Shared by the dashboard forms (browser) and the API (server). No runtime deps.

export const RESERVED = {
  profile: "Business profile",
  products: "Products & services",
  policies: "Policies",
  faqs: "FAQs",
} as const;
export type SectionKey = keyof typeof RESERVED;

export const SECTION_WEIGHTS: Record<SectionKey | "extra", number> = {
  profile: 30,
  products: 25,
  policies: 20,
  faqs: 15,
  extra: 10,
};

/** 0-100 "how well taught is this bot", from the titles of its knowledge entries. */
export function scoreKnowledge(titles: string[]) {
  const has = (k: SectionKey) => titles.includes(RESERVED[k]);
  const reserved = new Set<string>(Object.values(RESERVED));
  let score = 0;
  (Object.keys(RESERVED) as SectionKey[]).forEach((k) => {
    if (has(k)) score += SECTION_WEIGHTS[k];
  });
  if (titles.some((t) => !reserved.has(t))) score += SECTION_WEIGHTS.extra;
  return score;
}

export function strengthLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 30) return "Basic";
  return "Just starting";
}

/* ------------------------------ field definitions ------------------------------ */

export type FieldDef = { key: string; label: string; hint?: string; placeholder: string; rows?: number };

export const PROFILE_FIELDS: FieldDef[] = [
  { key: "name", label: "Business name", placeholder: "Varun Arts" },
  { key: "about", label: "What does your business do?", rows: 3, hint: "The first thing a customer asks. Two or three sentences is perfect.", placeholder: "We are a family-run stationery shop in Rohini, Delhi. We sell books, notebooks, art supplies and school kits, and we have been open since 2012." },
  { key: "address", label: "Address", placeholder: "Shop 14, Sector 7 Market, Rohini, New Delhi 110085 (opposite the metro station)" },
  { key: "area", label: "Areas you serve", placeholder: "Delhi NCR. Home delivery within 15 km of the shop." },
  { key: "phone", label: "Phone or WhatsApp number", placeholder: "+91 98765 43210" },
  { key: "email", label: "Email", placeholder: "hello@varunarts.com" },
  { key: "links", label: "Website and social links", placeholder: "varunarts.com · instagram.com/varunarts" },
  { key: "hours", label: "Opening hours", rows: 3, hint: "Include holidays and any special days.", placeholder: "Monday to Saturday: 10am to 8pm\nSunday: closed\nClosed on Diwali and Holi" },
  { key: "languages", label: "Languages you reply in", placeholder: "English and Hindi" },
  { key: "payments", label: "Payment methods", placeholder: "UPI, all major cards, and cash on delivery for orders up to Rs 2,000" },
  { key: "different", label: "What makes you different?", rows: 3, placeholder: "Largest range of school notebooks in the area, bulk discounts for schools, and free gift wrapping." },
  { key: "contact", label: "Who handles urgent issues?", hint: "Where the bot sends people when it cannot help.", placeholder: "Varun (owner), 98765 43210, available 10am to 6pm" },
];

export const POLICY_FIELDS: FieldDef[] = [
  { key: "delivery", label: "Delivery and shipping", rows: 4, hint: "Areas, charges, time, tracking.", placeholder: "Free delivery on orders above Rs 500 within Delhi NCR. Below Rs 500 the charge is Rs 40. Delivery takes 2 to 3 working days. Outside Delhi NCR we ship by courier in 5 to 7 days for a flat Rs 99. We share a tracking link on WhatsApp once the order ships." },
  { key: "returns", label: "Returns and refunds", rows: 4, hint: "What can come back, how long, how they get their money.", placeholder: "Unused items in original packaging can be returned within 7 days of delivery. Damaged or wrong items are replaced free of charge, send a photo within 48 hours. Refunds go back to the original payment method in 5 to 7 working days. Custom-printed items cannot be returned." },
  { key: "payments", label: "Payments and pricing rules", rows: 3, placeholder: "Prices include GST. We accept UPI, cards and cash on delivery up to Rs 2,000. Bulk orders above 50 items get 10 percent off, ask our team for a quote." },
  { key: "warranty", label: "Warranty or guarantee", rows: 3, placeholder: "Art supplies and electronics carry the manufacturer's warranty. We help with warranty claims, keep your bill." },
  { key: "booking", label: "Booking, appointments and cancellations", rows: 3, placeholder: "Custom orders need a 50 percent advance. Cancel within 24 hours for a full refund of the advance." },
  { key: "rules", label: "Anything else customers should know", rows: 3, placeholder: "We do not sell on credit. Bulk school orders are handled by Varun directly." },
];

export const PRODUCT_FIELDS = ["name", "price", "availability", "details"] as const;

export const COMMON_FAQS = [
  "How can I contact you?",
  "Where are you located?",
  "What are your opening hours?",
  "Do you offer discounts or bulk prices?",
  "Do you take custom orders?",
  "How long does delivery take?",
  "What is your return policy?",
  "Which payment methods do you accept?",
  "Do you have this in stock?",
  "Can I speak to a person?",
];

/* --------------------------------- text format --------------------------------- */
// Entries are stored as plain "Label: value" paragraphs. They read well to the AI and can be
// parsed back into the forms when you edit. Multi-line values continue on lines indented by 2 spaces.

export function toBlock(pairs: [string, string][]) {
  return pairs
    .filter(([, v]) => v.trim())
    .map(([label, v]) => {
      const lines = v.trim().replace(/\r/g, "").replace(/\n{2,}/g, "\n").split("\n");
      return `${label}: ${lines[0]}` + lines.slice(1).map((l) => `\n  ${l}`).join("");
    })
    .join("\n");
}

export function parseBlocks(text: string): Record<string, string>[] {
  return text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((par) => {
      const rec: Record<string, string> = {};
      let last = "";
      for (const line of par.split("\n")) {
        if (line.startsWith("  ") && last) {
          rec[last] += "\n" + line.slice(2);
          continue;
        }
        const i = line.indexOf(":");
        if (i > 0) {
          last = line.slice(0, i).trim();
          rec[last] = line.slice(i + 1).trim();
        }
      }
      return rec;
    })
    .filter((r) => Object.keys(r).length > 0);
}

/** One paragraph per field, so every fact is its own searchable piece. */
export function fieldsToText(fields: FieldDef[], values: Record<string, string>, suffix = "") {
  return fields
    .filter((f) => (values[f.key] ?? "").trim())
    .map((f) => toBlock([[f.label + suffix, values[f.key]]]))
    .join("\n\n");
}

export function textToFields(fields: FieldDef[], text: string, suffix = "") {
  const out: Record<string, string> = {};
  const flat: Record<string, string> = {};
  parseBlocks(text).forEach((b) => Object.assign(flat, b));
  for (const f of fields) out[f.key] = flat[f.label + suffix] ?? "";
  return out;
}
