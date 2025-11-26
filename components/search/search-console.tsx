"use client";

import { useMemo, useState } from "react";

import type { SearchEngineDTO } from "@/types/search-engine";
import { buildSearchUrl, parseSearchInput } from "@/lib/search";

type SearchConsoleProps = {
  engines: SearchEngineDTO[];
};

export const SearchConsole = ({ engines }: SearchConsoleProps) => {
  const defaultEngine =
    engines.find((engine) => engine.isDefault) ?? engines[0];
  const [query, setQuery] = useState("");
  const [selectedShortcut, setSelectedShortcut] = useState(
    defaultEngine?.shortcut
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedEngine = useMemo(() => {
    return (
      engines.find((engine) => engine.shortcut === selectedShortcut) ??
      defaultEngine
    );
  }, [engines, defaultEngine, selectedShortcut]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!query.trim()) {
      setFeedback("Enter something to search");
      return;
    }

    const parsed = parseSearchInput(query);
    let engine = selectedEngine;
    let searchText = parsed.query;

    if (parsed.shortcut) {
      const match = engines.find((item) => item.shortcut === parsed.shortcut);
      if (match) {
        engine = match;
      } else {
        // Not found, search the full query on default engine
        searchText = parsed.shortcut + (parsed.query ? " " + parsed.query : "");
        setFeedback(
          `No shortcut "${parsed.shortcut}" – searching "${searchText}" on ${engine.displayName}`
        );
      }
    }

    if (!searchText) {
      setFeedback("Nothing to search after removing the shortcut");
      return;
    }

    const targetUrl = buildSearchUrl(engine.urlTemplate, searchText);
    window.location.href = targetUrl;
  };

  if (!defaultEngine) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-400 bg-white/80 p-6 text-center shadow-sm">
        <p className="text-lg font-medium">No search engines configured yet.</p>
        <p className="text-sm text-zinc-500">
          Sign in to the admin panel to add one.
        </p>
      </div>
    );
  }

  return (
    <section className="w-full rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-xl shadow-zinc-200/60 backdrop-blur">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Active engine
        </p>
        <p className="text-2xl font-semibold text-zinc-900">
          {selectedEngine?.displayName ?? defaultEngine.displayName}
          <span className="ml-2 text-base font-normal text-zinc-500">
            @{selectedEngine?.shortcut ?? defaultEngine.shortcut}
          </span>
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="search-input">
          Search query
        </label>
        <input
          id="search-input"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Try ${defaultEngine.shortcut} open web privacy`}
          className="w-full rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-lg text-zinc-900 shadow-inner shadow-white/40 outline-none ring-2 ring-transparent transition focus:border-zinc-400 focus:ring-indigo-200"
        />
        <div className="flex flex-wrap gap-2 text-sm text-zinc-500">
          <span className="font-medium text-zinc-600">Tips:</span>
          <span>Start with a shortcut name to use that engine.</span>
          <span>Use @shortcut to search on the default engine.</span>
          <span>Press enter to search via the active engine.</span>
        </div>
        {feedback && <p className="text-sm text-amber-600">{feedback}</p>}
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-indigo-500"
        >
          Search now
        </button>
      </form>

      <div className="mt-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Saved shortcuts
        </p>
        <div className="flex flex-wrap gap-2">
          {engines.map((engine) => (
            <button
              key={engine.id}
              type="button"
              onClick={() => {
                setSelectedShortcut(engine.shortcut);
                setFeedback(null);
              }}
              className={`rounded-full border px-4 py-1 text-sm transition ${
                engine.shortcut === selectedEngine?.shortcut
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {engine.shortcut}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
