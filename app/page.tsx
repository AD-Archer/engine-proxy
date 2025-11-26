import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { CollapsibleSection } from "@/components/collapsible-section";
import { CopyButton } from "@/components/copy-button";
import { SearchConsole } from "@/components/search/search-console";
import { fetchEngines } from "@/lib/engines";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const incomingQuery = params?.q;
  if (typeof incomingQuery === "string" && incomingQuery.trim().length > 0) {
    redirect(`/go?q=${encodeURIComponent(incomingQuery)}`);
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const baseUrl = `http://${host}`;

  const engines = await fetchEngines();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-200/70">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Search Engine Proxy
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">
            One search bar, unlimited engines.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            Self-host this lightweight proxy, add shortcuts like{" "}
            <strong className="font-semibold text-slate-900">bing</strong>,{" "}
            <strong className="font-semibold text-slate-900">google</strong>, or
            even AI tools, and instantly switch where your queries go. Visitors
            can search freely, but only you can manage engines with the admin
            shortcut editor.
          </p>
        </section>

        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Add Engine Proxy to your browser
            </h2>
            <p className="text-slate-600">
              Create a custom search engine in Chrome, Edge, Arc, or Brave that
              points to the URL below. This allows you to search directly from
              your browser&apos;s address bar. Start with a shortcut name to use
              that engine, or use @shortcut to search on the default engine.
            </p>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Search URL:</p>
              <code className="mt-2 block break-all rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-900">
                {baseUrl}/search?q=%s
              </code>
              <CopyButton text={`${baseUrl}/search?q=%s`} />
            </div>
          </div>
        </section>

        <SearchConsole engines={engines} />

        <CollapsibleSection
          title="Included shortcuts"
          description="Preloaded with privacy-first engines, AI helpers, and classic web search. Start your query with the shortcut name to jump straight there. Use @shortcut to search on the default engine instead."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {engines.map((engine) => (
              <article
                key={engine.id}
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
              >
                <header className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {engine.displayName}
                    </h3>
                    <p className="text-sm text-slate-500">{engine.shortcut}</p>
                  </div>
                  {engine.isDefault && (
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                      Default
                    </span>
                  )}
                </header>
                {engine.description && (
                  <p className="text-sm text-slate-600">{engine.description}</p>
                )}
                <p className="mt-2 break-all text-xs text-slate-400">
                  {engine.urlTemplate}
                </p>
              </article>
            ))}
          </div>
        </CollapsibleSection>
      </main>
      <footer className="mt-16 border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-600">
              Built with love by{" "}
              <a
                href="https://www.antonioarcher.com"
                className="text-indigo-600 hover:text-indigo-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                Antonio Archer
              </a>
            </p>
            <div className="flex gap-4">
              <a
                href="/admin"
                className="text-sm text-slate-600 hover:text-slate-500"
              >
                Admin
              </a>
              <a
                href="https://github.com/ad-archer/engine-proxy"
                className="text-sm text-slate-600 hover:text-slate-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a
                href="https://hub.docker.com/r/adarcher/engine-proxy"
                className="text-sm text-slate-600 hover:text-slate-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                Docker Hub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
