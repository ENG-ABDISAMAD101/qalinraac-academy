"use client";

import Link from "next/link";
import { authLoginHref, authRegisterHref } from "@/lib/auth-routes";
import { Button } from "@/components/ui/button";

/** Placeholder until Forgot Password API is wired. */
export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-[1.75rem] border border-border/80 p-8 text-center shadow-[0_20px_50px_-30px_rgba(0,43,92,0.35)]">
        <h1 className="font-display text-2xl font-bold text-brand-navy">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Password reset will be available here. For now, return to sign in or
          create a new account.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="rounded-2xl">
            <Link href={authLoginHref()}>Back to sign in</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href={authRegisterHref()}>Create account</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
