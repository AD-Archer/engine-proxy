"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { SignInState } from "@/app/admin/sign-in/actions";

type Props = {
  action: (state: SignInState, formData: FormData) => Promise<SignInState>;
  redirectTo: string;
  credentialsConfigured: boolean;
};

const initialState: SignInState = {};

export function SignInForm({
  action,
  redirectTo,
  credentialsConfigured,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useActionState<SignInState, FormData>(
    action,
    initialState
  );

  return (
    <form
      action={formAction}
      data-lpignore="true"
      suppressHydrationWarning
      className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-slate-200/70"
    >
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Sign in to manage shortcuts
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {credentialsConfigured
            ? "Use the admin credentials from your environment file."
            : "Set ADMIN_USERNAME and ADMIN_PASSWORD in your environment file before signing in."}
        </p>
      </div>

      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="space-y-1" suppressHydrationWarning>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="username"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          data-lpignore="true"
          data-form-type="other"
          data-lastpass="off"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
          required
        />
      </div>

      <div className="space-y-1" suppressHydrationWarning>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            data-lpignore="true"
            data-form-type="password"
            data-lastpass="off"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-20 text-base text-slate-900 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "View"}
          </button>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton disabled={!credentialsConfigured} />
    </form>
  );
}

const SubmitButton = ({ disabled }: { disabled?: boolean }) => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
};
