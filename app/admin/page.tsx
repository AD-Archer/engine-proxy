import type { Metadata } from "next";
import Link from "next/link";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { fetchEngines } from "@/lib/engines";

export const metadata: Metadata = {
  title: "Manage search engines shortcuts • Engine Proxy • admin dashboard",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const engines = await fetchEngines();

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/60 bg-white p-10 shadow-xl shadow-slate-200/70">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Admin tools
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900">
            Manage your search shortcuts
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">
            Signed-in admins can add, edit, or remove shortcut definitions with
            clear, high-contrast controls. Public visitors keep using the proxy
            without needing credentials.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ← Back home
            </Link>
          </div>
        </header>
        <AdminDashboard initialEngines={engines} />
      </main>
    </div>
  );
}
