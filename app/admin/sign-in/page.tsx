import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/admin/sign-in-form";
import {
  getDefaultRedirectPath,
  getSessionCookieName,
  hasValidSession,
  sanitizeRedirectPath,
} from "@/lib/auth";

import { authenticate } from "./actions";

export const metadata: Metadata = {
  title: "Admin sign in • Engine Proxy",
};

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const credentialsConfigured = Boolean(username && password);

  const params = await searchParams;
  const redirectParam =
    typeof params?.redirectTo === "string"
      ? sanitizeRedirectPath(params.redirectTo)
      : null;
  const redirectTarget = redirectParam ?? getDefaultRedirectPath();

  if (credentialsConfigured) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(getSessionCookieName())?.value;
    const alreadySignedIn = await hasValidSession(
      sessionCookie,
      username,
      password
    );

    if (alreadySignedIn) {
      redirect(redirectTarget);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-8 px-4 py-16 lg:flex-row">
        <section className="w-full max-w-xl space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-200/70">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Engine Proxy
            </p>
            <Link
              href="/"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Back home
            </Link>
          </div>
          <h1 className="text-4xl font-semibold text-slate-900">
            Secure admin console
          </h1>
          <p className="text-base leading-relaxed text-slate-600">
            Sign in to curate the shortcut catalog powering your search proxy.
            Credentials are configured via environment variables{" "}
            <code className="rounded bg-slate-100 px-1">ADMIN_USERNAME</code>{" "}
            and{" "}
            <code className="rounded bg-slate-100 px-1">ADMIN_PASSWORD</code>.
          </p>
          <ul className="space-y-2 text-sm text-slate-500">
            <li>• Session stays active for 12 hours</li>
            <li>• Uses secure, HTTP-only cookies</li>
            <li>• Credentials never leave your server</li>
          </ul>
        </section>
        <div className="w-full max-w-md">
          <SignInForm
            action={authenticate}
            redirectTo={redirectTarget}
            credentialsConfigured={credentialsConfigured}
          />
        </div>
      </main>
    </div>
  );
}
