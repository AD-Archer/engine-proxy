"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Toast, { type ToastProps } from "./toast";

type ToastInternal = ToastProps & { timeout?: number };

type ToastContextType = {
  toast: (message: string, tone?: ToastProps["tone"], timeout?: number) => string | number;
  success: (message: string, timeout?: number) => string | number;
  error: (message: string, timeout?: number) => string | number;
  info: (message: string, timeout?: number) => string | number;
  confirm: (message: string) => Promise<boolean>;
  dismiss: (id: string | number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);

  const dismiss = useCallback((id: string | number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((message: string, tone: ToastProps["tone"] = "info", timeout = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, message, tone, timeout }]);
    if (timeout && timeout > 0) {
      setTimeout(() => dismiss(id), timeout);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((m: string, t?: number) => toast(m, "success", t), [toast]);
  const error = useCallback((m: string, t?: number) => toast(m, "error", t), [toast]);
  const info = useCallback((m: string, t?: number) => toast(m, "info", t), [toast]);

  // confirm dialog via promise handled with actions buttons in the toast
  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      const id = Date.now() + Math.random();
      const onConfirm = () => {
        dismiss(id);
        resolve(true);
      };
      const onCancel = () => {
        dismiss(id);
        resolve(false);
      };

      const actions = (
        <div className="flex gap-2">
          <button className="rounded-md bg-red-600 px-3 py-1 text-xs text-white" onClick={onConfirm}>Confirm</button>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs" onClick={onCancel}>Cancel</button>
        </div>
      );

      setToasts((ts) => [...ts, { id, message, tone: "warning", timeout: 0, actions }]);
    });
  }, [dismiss]);

  const value = useMemo(() => ({ toast, success, error, info, confirm, dismiss }), [toast, success, error, info, confirm, dismiss]);

  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && typeof window !== "undefined"
        ? createPortal(
            <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end">{toasts.map((t) => (
              <Toast key={t.id} {...t} />
            ))}</div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
