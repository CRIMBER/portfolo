"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { setUsername } from "./actions";

export function UsernameForm({ currentUsername }: { currentUsername: string | null }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string | null }, formData: FormData) => setUsername(formData),
    { error: null },
  );
  const [saved, setSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    const justFinished = wasPending.current && !pending;
    wasPending.current = pending;
    if (justFinished && !state.error) {
      setSaved(true);
      const timer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [pending, state.error]);

  return (
    <form action={formAction}>
      <label>
        Username
        <input
          name="username"
          defaultValue={currentUsername ?? ""}
          placeholder="your-handle"
          required
        />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
      {state.error && (
        <span className="badge" data-tone="danger">
          {state.error}
        </span>
      )}
      {saved && !state.error && (
        <span className="badge" data-tone="success">
          Saved
        </span>
      )}
    </form>
  );
}
