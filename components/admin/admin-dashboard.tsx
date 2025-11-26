"use client";

import { useMemo, useState } from "react";

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
  urlTemplate: "https://example.com/search?q={query}",
  description: "",
  isDefault: false,
};

type Props = {
  initialEngines: SearchEngineDTO[];
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
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<EngineFormState | null>(null);

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

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/shortcuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error?.message ?? "Unable to save shortcut");
      }

      setForm(emptyForm);
      await refresh();
      setMessage("Shortcut created");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/shortcuts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error?.message ?? "Unable to delete shortcut");
      }
      await refresh();
      setMessage("Shortcut removed");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    if (editingId == null || !editingForm) {
      return;
    }
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/shortcuts/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingForm),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error?.message ?? "Unable to update shortcut");
      }

      setEditingId(null);
      setEditingForm(null);
      await refresh();
      setMessage("Shortcut updated");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const setAsDefault = async (id: number) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/shortcuts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error?.message ?? "Unable to set default");
      }
      await refresh();
      setMessage("Default updated");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const openEditor = (engine: SearchEngineDTO) => {
    setEditingId(engine.id);
    setEditingForm(normalize(engine));
    setMessage(null);
  };

  const closeEditor = () => {
    setEditingId(null);
    setEditingForm(null);
  };

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Add a shortcut</h2>
        <p className="text-sm text-slate-500">
          Users can start queries with the shortcut name to use this engine.{" "}
          {""}
          The URL template must include{" "}
          <code className="rounded bg-slate-100 px-1">{`{query}`}</code> where
          the search text should go.
        </p>
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
              Shortcut (letters, numbers, - or _)
            </label>
            <input
              id="shortcut"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.shortcut}
              onChange={(event) =>
                setForm({ ...form, shortcut: event.target.value })
              }
              required
            />
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
              onChange={(event) =>
                setForm({ ...form, urlTemplate: event.target.value })
              }
              required
            />
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
        {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          Manage shortcuts
        </h2>
        {sortedEngines.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No shortcuts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200">
            {sortedEngines.map((engine) => (
              <li key={engine.id} className="py-4">
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
                        onChange={(event) =>
                          setEditingForm({
                            ...editingForm,
                            shortcut: event.target.value,
                          })
                        }
                      />
                      <input
                        className="sm:col-span-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                        value={editingForm.urlTemplate}
                        onChange={(event) =>
                          setEditingForm({
                            ...editingForm,
                            urlTemplate: event.target.value,
                          })
                        }
                      />
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
    </div>
  );
};
