import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms", description: `The simple rules for using ${BRAND.name}.` };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="22 November 2026"
      intro={`${BRAND.name} is a free portfolio demo, provided as it is. It may change, go offline or lose data at any time, so please don't depend on it for a real business.`}
      sections={[
        {
          heading: "Using the demo",
          body: [
            "You may try the product, create bots and chat with them. In return, please:",
            [
              "Use sample information, not real personal, customer or confidential data.",
              "Only import a website that you own or have permission to use.",
              "Don't upload anything unlawful, harmful or that you don't have the right to share.",
              "Don't try to break, overload or get around the limits of the service, or attack other people's data.",
            ],
          ],
        },
        {
          heading: "AI can be wrong",
          body: [
            "Replies are written by an AI model from the knowledge you provide. It is designed to answer only from that knowledge and to hand over to a person when unsure, but it can still make mistakes. Check important answers, and test your bot before showing it to anyone.",
          ],
        },
        {
          heading: "No promises",
          body: [
            "The service comes with no warranty and no uptime promise. Plans and prices shown on the pricing page describe a possible future, and nothing is charged today. We may limit or remove accounts or data that break these rules.",
          ],
        },
        {
          heading: "Your content",
          body: [
            "You keep ownership of what you add. You allow the service to process it, including sending parts of it to the AI provider described in the Privacy page, only to run your bot.",
          ],
        },
        {
          heading: "Questions",
          body: ["This page is plain-language information for a demo project and is not legal advice. Contact the developer through the portfolio or GitHub profile that linked you here."],
        },
      ]}
    />
  );
}
