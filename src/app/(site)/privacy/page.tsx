import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy", description: `How ${BRAND.name} handles your data.` };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="22 November 2026"
      intro={`${BRAND.name} is a portfolio project that shows how an AI customer-support assistant can work. Please don't enter real personal, customer or confidential business information. Use sample data.`}
      sections={[
        {
          heading: "What we store",
          body: [
            "When you use the dashboard we store:",
            [
              "Your email address and a hashed password (handled by Supabase Auth).",
              "Your business name and the bots you create.",
              "The knowledge you add: text, uploaded files turned into text, and pages read from your website.",
              "Chat conversations between visitors and your bots, so you can read them in your inbox.",
            ],
            "Visitors who chat with a bot are not asked for any account. The chat window keeps a random conversation ID in the browser's local storage so a conversation can continue when the visitor moves between pages.",
          ],
        },
        {
          heading: "Who else sees it",
          body: [
            "To write a reply, the visitor's message, the recent conversation and the most relevant parts of your knowledge are sent to Google's Gemini AI. Please read Google's terms for the Gemini API. On Google's free tier, Google may use the content it receives to improve its products, which is another reason not to submit real or confidential data here.",
            "Your data is stored in a Supabase database. The app is hosted on Vercel. These services process data on our behalf.",
            "We do not sell your data, show ads or use analytics trackers.",
          ],
        },
        {
          heading: "Cookies and local storage",
          body: [
            "We use one sign-in cookie so you stay logged in, and the chat window's local storage described above. Nothing else.",
          ],
        },
        {
          heading: "Reading your website",
          body: [
            "If you use \"Import from website\", our server fetches the public pages of the address you enter, respecting its robots.txt file. You must only enter a website you own or have permission to use. Pages are read once, shown to you for review, and only saved if you choose to.",
          ],
        },
        {
          heading: "Deleting your data",
          body: [
            "You can delete any knowledge entry, and delete a whole bot together with its knowledge and conversations, from the dashboard at any time. To remove your account completely, contact the developer using the details on the portfolio or GitHub profile that linked you here.",
          ],
        },
        {
          heading: "Questions",
          body: ["This page is plain-language information for a demo project and is not legal advice. For questions, contact the developer through the portfolio or GitHub profile that linked you here."],
        },
      ]}
    />
  );
}
