"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorNote, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode, initialError = "" }: { mode: "login" | "signup"; initialError?: string }) {
  const router = useRouter();
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const supabase = createClient();
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { business_name: business.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0) {
          throw new Error("An account with this email already exists. Try logging in.");
        }
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setNotice("Almost done! We sent a confirmation link to your email. Open it to finish creating your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isSignup ? "Free to start. No card needed." : "Log in to manage your assistant."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {isSignup && (
          <Field label="Business name">
            <Input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Varun Arts" required maxLength={80} autoComplete="organization" />
          </Field>
        )}
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required autoComplete="email" />
        </Field>
        <Field label="Password" hint={isSignup ? "At least 8 characters." : undefined}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={isSignup ? "new-password" : "current-password"} />
        </Field>

        <ErrorNote>{error}</ErrorNote>
        {notice && (
          <p role="status" className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">
            {notice}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-brand hover:underline">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
