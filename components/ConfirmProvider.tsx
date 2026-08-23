"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./ConfirmProvider.module.css";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // "danger" downplays the confirm button (btn-secondary + red) rather
  // than making it the gradient primary — every caller today confirms
  // something irreversible, and the primary gradient button reads as
  // "the recommended action," which a destructive one never is.
  tone?: "default" | "danger";
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

interface PendingConfirm {
  options: Required<ConfirmOptions>;
  resolve: (result: boolean) => void;
}

const ConfirmContext = createContext<ConfirmFn | null>(null);

// Swaps out window.confirm()'s browser-chrome dialog (unstyled, jarring
// against the rest of the app) for one that looks like the product.
// Mounted once in the root layout so any client component can call
// useConfirm() without wiring its own dialog state.
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    const raw = typeof opts === "string" ? { message: opts } : opts;
    const options: Required<ConfirmOptions> = {
      title: "",
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      tone: "default",
      ...raw,
    };
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const settle = useCallback(
    (result: boolean) => {
      pending?.resolve(result);
      setPending(null);
    },
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    cancelRef.current?.focus();
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") settle(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className={styles.overlay} onClick={() => settle(false)}>
          <div className={`panel ${styles.dialog}`} role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {pending.options.title && <h3>{pending.options.title}</h3>}
            <p>{pending.options.message}</p>
            <div className={styles.actions}>
              <button type="button" ref={cancelRef} className="btn-secondary" onClick={() => settle(false)}>
                {pending.options.cancelLabel}
              </button>
              <button
                type="button"
                className={pending.options.tone === "danger" ? "btn-secondary" : undefined}
                data-tone={pending.options.tone === "danger" ? "danger" : undefined}
                onClick={() => settle(true)}
              >
                {pending.options.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
