'use client';

import { CheckCircle, X } from '@untitledui/icons';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
}

const ToastContext = createContext<((message: string) => void) | null>(null);

const TOAST_MS = 6000;

/** Short confirmations such as "Demo reset". They are announced to screen readers and close on their own. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message }]);
      setTimeout(() => {
        dismiss(id);
      }, TOAST_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 grid justify-items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-in pointer-events-auto flex w-full items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary shadow-lg ring-1 ring-secondary sm:w-80"
          >
            <CheckCircle className="size-5 shrink-0 text-fg-success-primary" aria-hidden />
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => {
                dismiss(toast.id);
              }}
              className="press rounded-md p-1 text-fg-quaternary outline-focus-ring hover:text-fg-secondary focus-visible:outline-2"
              aria-label="Dismiss"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string) => void {
  const notify = useContext(ToastContext);
  if (notify === null) throw new Error('useToast must be used inside ToastProvider');
  return notify;
}
