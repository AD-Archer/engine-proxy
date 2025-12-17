"use client";

import { useMemo, useState } from "react";
import { load as yamlLoad, dump as yamlDump } from "js-yaml";

import type { SearchEngineDTO } from "@/types/search-engine";

type EngineFormState = {
  displayName: string;
  shortcut: string;
  urlTemplate: string;
  description: string;
  isDefault: boolean;
};

const emptyForm: EngineFormState = {
  displayName: "",
  shortcut: "",
  urlTemplate: "https://example.com/search?q=%s",
  description: "",
  isDefault: false,
};

type Props = {
  initialEngines: SearchEngineDTO[];
};

const normalizeUrlTemplate = (value: string) =>
  value.replace(/%s/g, "{query}");

/**
 * Check if a URL will have https:// auto-prepended
 */
const needsProtocol = (url: string): boolean => {
  if (typeof url !== "string" || url.trim() === "") {
    return false;
  }
  return !/^https?:\/\//i.test(url);
};

const PROTOCOL_WARNING_MESSAGE = "Note: https:// will be automatically added to your URL";

const extractErrorMessage = (
  payload: unknown,
  fallback: string
): string => {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object"
  ) {
    const error = payload.error as Record<string, unknown>;
    if (typeof error.message === "string") {
      return error.message;
    }

    const fieldErrors = error.fieldErrors as
      | Record<string, string[] | undefined>
      | undefined;
    const formErrors = error.formErrors as string[] | undefined;

    const messages: string[] = [];
    if (Array.isArray(formErrors)) {
      messages.push(...formErrors);
    }
    if (fieldErrors) {
      for (const [field, errs] of Object.entries(fieldErrors)) {
        if (errs && errs.length > 0) {
          messages.push(`${field}: ${errs.join(", ")}`);
        }
      }
    }

    if (messages.length > 0) {
      return messages.join(" · ");
    }
  }

  return fallback;
};

const normalize = (engine: SearchEngineDTO): EngineFormState => ({
  displayName: engine.displayName,
  shortcut: engine.shortcut,
  urlTemplate: engine.urlTemplate,
  description: engine.description ?? "",
  isDefault: engine.isDefault,
});

export const AdminDashboard = ({ initialEngines }: Props) => {
  const [engines, setEngines] = useState(initialEngines);
  const [form, setForm] = useState<EngineFormState>(emptyForm);
  const [status, setStatus] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<EngineFormState | null>(null);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);
  const [protocolWarning, setProtocolWarning] = useState<string | null>(null);
  const [editProtocolWarning, setEditProtocolWarning] = useState<string | null>(null);
  const [importText, setImportText] = useState<string>("");
  const [importMode, setImportMode] = useState<"add"|"combine"|"overwrite">("add");
  const [importBusy, setImportBusy] = useState(false);

  const sortedEngines = useMemo(() => {
    return [...engines].sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }, [engines]);

  const refresh = async () => {
    const response = await fetch("/api/shortcuts", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error?.message ?? "Unable to load shortcuts");
    }
    setEngines(payload.data ?? []);
  };

  const saveShortcut = async (
    formData: Partial<EngineFormState>,
    id: number | null
  ) => {
    setBusy(true);
    setStatus(null);
    setEditFeedback(null);
    setProtocolWarning(null);
    setEditProtocolWarning(null);

    try {
      const body = {
        ...formData,
        urlTemplate: formData.urlTemplate ? normalizeUrlTemplate(formData.urlTemplate) : undefined,
      };
      const url = id ? `/api/shortcuts/${id}` : "/api/shortcuts";
      const method = id ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(
          extractErrorMessage(errorPayload, id ? "Unable to update shortcut" : "Unable to save shortcut")
        );
      }

      if (!id) {
        setForm(emptyForm);
        setProtocolWarning(null);
      } else {
        setEditingId(null);
        setEditingForm(null);
        setEditProtocolWarning(null);
      }
      await refresh();
      setStatus({ message: id ? "Shortcut updated" : "Shortcut created", tone: "success" });
    } catch (error) {
      if (error instanceof Error) {
        setStatus({ message: error.message, tone: "error" });
        if (id) {
          setEditFeedback(error.message);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveShortcut(form, null);
  };

  const handleDelete = async (id: number) => {
    setBusy(true);
    setStatus(null);
    setEditFeedback(null);
    setProtocolWarning(null);
    setEditProtocolWarning(null);
    try {
      const response = await fetch(`/api/shortcuts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error?.message ?? "Unable to delete shortcut");
      }
      await refresh();
      setStatus({ message: "Shortcut removed", tone: "success" });
    } catch (error) {
      if (error instanceof Error) {
        setStatus({ message: error.message, tone: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    if (editingId == null || !editingForm) {
      return;
    }
    await saveShortcut(editingForm, editingId);
  };

  const setAsDefault = async (id: number) => {
    await saveShortcut({ isDefault: true }, id);
  };

  const openEditor = (engine: SearchEngineDTO) => {
    setEditingId(engine.id);
    setEditingForm(normalize(engine));
    setStatus(null);
    setEditFeedback(null);
    setEditProtocolWarning(null);
  };

  const closeEditor = () => {
    setEditingId(null);
    setEditingForm(null);
    setEditFeedback(null);
    setEditProtocolWarning(null);
  };

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Add a shortcut</h2>        <p className="mt-2 text-sm text-slate-700">Export / import controls are at the bottom of the page — <a href="#export-import" className="text-indigo-600 hover:text-indigo-500">jump to Export / Import</a></p>        <p className="text-sm text-slate-500">
          Users can start queries with the shortcut name to use this engine.{" "}
          {""}
          The URL template must include{" "}
          <code className="rounded bg-slate-100 px-1">{`{query}`}</code> where
          the search text should go.
        </p>
        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <span className="mt-2 h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
            <span>
              Point shortcuts at internal tools (e.g. docs, ticket trackers, runbooks) to quickly jump across your stack.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-2 h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
            <span>
              Route AI helpers or custom APIs: send {`{query}`} to a chatbot, RAG endpoint, or even self-hosted LLM.
            </span>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <span className="mt-2 h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
            <span>
              Create alias shortcuts like <code className="rounded bg-slate-100 px-1">!g</code> or <code className="rounded bg-slate-100 px-1">#ai</code> to mirror your muscle memory from other launchers.
            </span>
          </div>
        </div>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={handleCreate}
        >
          <div className="sm:col-span-1">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="displayName"
            >
              Display name
            </label>
            <input
              id="displayName"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.displayName}
              onChange={(event) =>
                setForm({ ...form, displayName: event.target.value })
              }
              required
            />
          </div>
          <div>
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="shortcut"
            >
              Shortcut (no spaces, no quotes)
            </label>
            <input
              id="shortcut"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.shortcut}
              pattern={String.raw`[^\s'"]+`}
              title="Use any characters except spaces or quotes"
              onChange={(event) =>
                setForm({ ...form, shortcut: event.target.value })
              }
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Symbols and single characters are fine (e.g. !, ?, %ai, /g). Spaces and quotes are blocked.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="urlTemplate"
            >
              URL template
            </label>
            <input
              id="urlTemplate"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.urlTemplate}
              onChange={(event) => {
                const newUrl = event.target.value;
                setForm({ ...form, urlTemplate: newUrl });
                
                // Check if protocol will be auto-added
                if (needsProtocol(newUrl)) {
                  setProtocolWarning(PROTOCOL_WARNING_MESSAGE);
                } else {
                  setProtocolWarning(null);
                }
              }}
              required
            />
            {protocolWarning && (
              <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                ℹ️ {protocolWarning}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              id="description"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              rows={3}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) =>
                setForm({ ...form, isDefault: event.target.checked })
              }
            />
            Set as default search engine
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? "Working..." : "Save shortcut"}
            </button>
          </div>
        </form>
        {status && (
          <p
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              status.tone === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {status.message}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          Manage shortcuts
        </h2>


        {/* Import area removed from here and moved to the bottom of the dashboard (see section at the end of this component) */}
        {sortedEngines.length === 0 ? (
          <p className="mt-4 text-sm text-slate-700">No shortcuts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200">
            {sortedEngines.map((engine) => (
              <li
                key={engine.id}
                className={`py-4 ${
                  engine.isDefault ? "rounded-xl bg-rose-50/80 px-3" : ""
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {engine.displayName}
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        {engine.shortcut}
                      </span>
                    </p>
                    {engine.description && (
                      <p className="text-sm text-slate-600">
                        {engine.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      {engine.urlTemplate}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <button
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-900 hover:bg-slate-50"
                      onClick={() => openEditor(engine)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-900 hover:bg-slate-50"
                      disabled={engine.isDefault}
                      onClick={() => setAsDefault(engine.id)}
                    >
                      {engine.isDefault ? "Default" : "Make default"}
                    </button>
                    <button
                      className="rounded-full border border-red-200 bg-white px-3 py-1 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(engine.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {editingId === engine.id && editingForm && (
                  <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    {editFeedback && (
                      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {editFeedback}
                      </p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                        value={editingForm.displayName}
                        onChange={(event) =>
                          setEditingForm({
                            ...editingForm,
                            displayName: event.target.value,
                          })
                        }
                      />
                      <input
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                        value={editingForm.shortcut}
                        pattern={String.raw`[^\s'"]+`}
                        title="Use any characters except spaces or quotes"
                        onChange={(event) =>
                          setEditingForm({
                            ...editingForm,
                            shortcut: event.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-slate-500">
                        Symbols and single characters are allowed. Avoid spaces and quotes.
                      </p>
                      <div className="sm:col-span-2">
                        <input
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                          value={editingForm.urlTemplate}
                          onChange={(event) => {
                            const newUrl = event.target.value;
                            setEditingForm({
                              ...editingForm,
                              urlTemplate: newUrl,
                            });
                            
                            // Check if protocol will be auto-added
                            if (needsProtocol(newUrl)) {
                              setEditProtocolWarning(PROTOCOL_WARNING_MESSAGE);
                            } else {
                              setEditProtocolWarning(null);
                            }
                          }}
                        />
                        {editProtocolWarning && (
                          <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                            ℹ️ {editProtocolWarning}
                          </p>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        className="sm:col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                        value={editingForm.description}
                        onChange={(event) =>
                          setEditingForm({
                            ...editingForm,
                            description: event.target.value,
                          })
                        }
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={editingForm.isDefault}
                        onChange={(event) =>
                          setEditingForm({
                            ...editingForm,
                            isDefault: event.target.checked,
                          })
                        }
                      />
                      Set as default
                    </label>
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
                        onClick={submitEdit}
                      >
                        Save changes
                      </button>
                      <button
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 hover:bg-slate-50"
                        onClick={closeEditor}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="export-import" className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Export / Import</h2>
        <p className="mt-2 text-sm text-slate-700">Export current shortcuts or import JSON/YAML. Paste, drop, or upload a file, then choose how to merge.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={async () => {
              try {
                setBusy(true);
                setStatus(null);
                const res = await fetch("/api/shortcuts", { cache: "no-store" });
                const payload = await res.json().catch(() => ({}));
                if (!res.ok) {
                  throw new Error(payload.error?.message ?? "Unable to export shortcuts");
                }
                const data = payload.data ?? [];
                const now = new Date().toISOString().split("T")[0];
                const fileNameBase = `searchengines-engineproxy-${now}`;

                // JSON
                const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const jsonUrl = URL.createObjectURL(jsonBlob);
                const a = document.createElement("a");
                a.href = jsonUrl;
                a.download = `${fileNameBase}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(jsonUrl);

                setStatus({ message: "Export downloaded", tone: "success" });
              } catch (err) {
                setStatus({ message: err instanceof Error ? err.message : "Export failed", tone: "error" });
              } finally {
                setBusy(false);
              }
            }}
          >
            Export JSON
          </button>

          <button
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={async () => {
              try {
                setBusy(true);
                setStatus(null);
                const res = await fetch("/api/shortcuts", { cache: "no-store" });
                const payload = await res.json().catch(() => ({}));
                if (!res.ok) {
                  throw new Error(payload.error?.message ?? "Unable to export shortcuts");
                }
                const data = payload.data ?? [] as SearchEngineDTO[];
                const now = new Date().toISOString().split("T")[0];
                const fileNameBase = `searchengines-engineproxy-${now}`;

                // YAML
                const yamlText = yamlDump(data as SearchEngineDTO[]);
                const yamlBlob = new Blob([yamlText], { type: "text/yaml" });
                const yamlUrl = URL.createObjectURL(yamlBlob);
                const b = document.createElement("a");
                b.href = yamlUrl;
                b.download = `${fileNameBase}.yaml`;
                document.body.appendChild(b);
                b.click();
                b.remove();
                URL.revokeObjectURL(yamlUrl);

                setStatus({ message: "Export downloaded", tone: "success" });
              } catch (err) {
                setStatus({ message: err instanceof Error ? err.message : "Export failed", tone: "error" });
              } finally {
                setBusy(false);
              }
            }}
          >
            Export YAML
          </button>

          <label className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <input
              type="file"
              accept=".json,.yaml,.yml,application/json,text/yaml"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files ? e.target.files[0] : null;
                if (!file) return;
                setStatus(null);
                setEditFeedback(null);
                try {
                  const text = await file.text();
                  setImportText(text);
                  setStatus({ message: `Loaded ${file.name}`, tone: "success" });
                } catch {
                  setStatus({ message: "Unable to read file", tone: "error" });
                }
              }}
            />
            Import from file (JSON/YAML)
          </label>
        </div>

        <div className="mt-4">
          <textarea
            rows={8}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='[ { "shortcut": "g", "displayName": "Google", "urlTemplate": "https://google.com/search?q={query}", "isDefault": false } ]\n# OR YAML list\n- shortcut: g\n  displayName: Google\n  urlTemplate: https://google.com/search?q={query}\n  isDefault: false'
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer?.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                setImportText(String(reader.result ?? ""));
                setStatus({ message: `Loaded ${file.name}`, tone: "success" });
              };
              reader.readAsText(file);
            }}
            onDragOver={(e) => e.preventDefault()}
          />

          <div className="mt-3 flex items-center gap-4">
            <label className="text-sm text-slate-700">
              <input type="radio" name="importModeBottom" checked={importMode === "add"} onChange={() => setImportMode("add")} /> Add missing only
            </label>
            <label className="text-sm text-slate-700">
              <input type="radio" name="importModeBottom" checked={importMode === "combine"} onChange={() => setImportMode("combine")} /> Combine (keep both)
            </label>
            <label className="text-sm text-slate-700">
              <input type="radio" name="importModeBottom" checked={importMode === "overwrite"} onChange={() => setImportMode("overwrite")} /> Overwrite
              <span className="ml-2 inline-block rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Destructive</span>
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 text-white"
              disabled={importBusy}
              onClick={async () => {
                setImportBusy(true);
                setStatus(null);

                // Confirm destructive action
                if (importMode === "overwrite") {
                  const confirmed = window.confirm(
                    "Overwrite will remove ALL current shortcuts and replace them with the imported list. This cannot be undone. Are you sure you want to continue?"
                  );
                  if (!confirmed) {
                    setImportBusy(false);
                    return;
                  }
                }

                try {
                  let parsed: unknown;

                  // Try JSON first
                  try {
                    parsed = JSON.parse(importText || "[]");
                  } catch {
                    // Try YAML
                    try {
                      const yamlVal = yamlLoad(importText || "");
                      parsed = yamlVal;
                    } catch {
                      throw new Error("Invalid JSON or YAML");
                    }
                  }

                  if (!Array.isArray(parsed)) {
                    throw new Error("Expected an array of engines");
                  }

                  const res = await fetch("/api/shortcuts/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mode: importMode, engines: parsed }),
                  });

                  const payload = await res.json().catch(() => ({}));

                  if (!res.ok) {
                    throw new Error(payload.error?.message ?? "Import failed");
                  }

                  await refresh();
                  setStatus({ message: "Import completed", tone: "success" });
                } catch (err) {
                  setStatus({ message: err instanceof Error ? err.message : "Import failed", tone: "error" });
                } finally {
                  setImportBusy(false);
                }
              }}
            >
              {importBusy ? "Importing..." : "Import"}
            </button>

            <button
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 hover:bg-slate-50"
              onClick={() => { setImportText(""); setStatus(null); }}
            >
              Clear
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
