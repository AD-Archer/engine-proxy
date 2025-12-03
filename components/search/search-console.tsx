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

  const activeEngineDescription =
    selectedEngine?.description ?? defaultEngine?.description;

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
      <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-indigo-50 px-5 py-4 shadow-inner shadow-indigo-100">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
            Active engine
          </p>
          {selectedEngine?.isDefault && (
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              Default
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-2xl font-semibold text-zinc-900">
            {selectedEngine?.displayName ?? defaultEngine.displayName}
          </p>
          <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-sm font-semibold text-indigo-700">
            @{selectedEngine?.shortcut ?? defaultEngine.shortcut}
          </span>
          {activeEngineDescription && (
            <span className="text-sm text-zinc-600">
              {activeEngineDescription}
            </span>
          )}
        </div>
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
          placeholder={`Now searching with @${(selectedEngine?.shortcut ?? defaultEngine.shortcut) || ""}`}
          className="w-full rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-lg text-zinc-900 shadow-inner shadow-white/40 outline-none ring-2 ring-transparent transition focus:border-zinc-400 focus:ring-indigo-200"
        />
        <div className="flex flex-wrap gap-2 text-sm text-zinc-600">
          <span className="font-semibold text-zinc-700">Tips:</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1">
            Shortcuts can be symbols too (e.g. !, ?ai, /g for Google).
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1">
            Start queries with a shortcut to jump engines instantly.
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1">
            Type a saved shortcut + text to search via the default engine.
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1">
            Press Enter to search with the highlighted active engine.
          </span>
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
