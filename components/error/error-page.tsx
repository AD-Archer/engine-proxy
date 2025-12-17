"use client";

import Link from "next/link";

type Action = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type ErrorPageProps = {
  title: string;
  description: string;
  primaryAction?: Action;
  secondaryAction?: Action;
};

const ActionButton = ({
  action,
  variant = "primary",
}: {
  action: Action;
  variant?: "primary" | "secondary";
}) => {
  const sharedClasses =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors";

  if (action.href) {
    return (
      <Link
        href={action.href}
        className={
          variant === "primary"
            ? `${sharedClasses} bg-indigo-600 text-white shadow hover:bg-indigo-500`
            : `${sharedClasses} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`
        }
      >
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      className={
        variant === "primary"
          ? `${sharedClasses} bg-indigo-600 text-white shadow hover:bg-indigo-500`
          : `${sharedClasses} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`
      }
    >
      {action.label}
    </button>
  );
};

export const ErrorPage = ({
  title,
  description,
  primaryAction,
  secondaryAction,
}: ErrorPageProps) => {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-white/80 px-8 py-12 text-center shadow-lg shadow-slate-200/70">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-bold text-indigo-600">
        !
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="text-lg leading-relaxed text-slate-600">{description}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap justify-center gap-3">
          {primaryAction ? <ActionButton action={primaryAction} variant="primary" /> : null}
          {secondaryAction ? <ActionButton action={secondaryAction} variant="secondary" /> : null}
        </div>
      )}
    </div>
  );
};

export default ErrorPage;
