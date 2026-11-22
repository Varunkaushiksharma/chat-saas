import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Log in" };

async function Form({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthForm
      mode="login"
      initialError={error === "confirm" ? "That confirmation link didn't work or has expired. Try logging in, or sign up again." : ""}
    />
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={null}>
      <Form searchParams={searchParams as Promise<{ error?: string }>} />
    </Suspense>
  );
}
