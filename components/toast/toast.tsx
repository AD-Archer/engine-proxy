"use client";

import { Fragment } from "react";
import { Transition } from "@headlessui/react";

type ToastTone = "success" | "error" | "info" | "warning";

export type ToastProps = {
  id: string | number;
  message: string;
  tone?: ToastTone;
  actions?: React.ReactNode;
};

export const Toast = ({ id, message, tone = "info", actions }: ToastProps) => {
  const toneClasses = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  } as Record<ToastTone, string>;

  const icons: Record<ToastTone, string> = {
    success: "OK",
    error: "!!",
    info: "i",
    warning: "!",
  };

  return (
    <Transition
      show={true}
      as={Fragment}
      enter="transform transition duration-150"
      enterFrom="opacity-0 translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transform transition duration-150"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-1"
    >
      <div
        key={id}
        className={`pointer-events-auto mb-4 flex w-[26rem] max-w-[calc(100vw-3rem)] items-start justify-between gap-4 rounded-2xl border px-5 py-4 shadow-lg shadow-slate-500/15 ${toneClasses[tone]}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-base font-semibold">
            {icons[tone]}
          </div>
          <div className="flex-1 text-base leading-relaxed">{message}</div>
        </div>
        {actions && <div className="ml-2 flex-shrink-0">{actions}</div>}
      </div>
    </Transition>
  );
};

export default Toast;
