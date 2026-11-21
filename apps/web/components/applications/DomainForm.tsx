"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { firstIssue } from "@/lib/validation/auth";
import { domainSchema } from "@/lib/validation/domain";

export function DomainForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const id = useId();
  const [hostname, setHostname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = domainSchema.safeParse({ hostname });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}/domains`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `The panel answered ${response.status}.`);
        return;
      }
      setHostname("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="form server-form"
      noValidate
      data-hydrated={hydrated ? "true" : undefined}
      onSubmit={onSubmit}
    >
      <div className="field">
        <label className="field__label" htmlFor={id}>
          Domain
        </label>
        <input
          className="field__input"
          id={id}
          value={hostname}
          onChange={(event) => setHostname(event.target.value)}
          placeholder="app.example.com"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>
      <div className="form__actions">
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Add domain"}
        </button>
      </div>
      {error ? (
        <p className="status" role="alert">
          <strong>The panel refused the request.</strong>
          {error}
        </p>
      ) : null}
    </form>
  );
}
