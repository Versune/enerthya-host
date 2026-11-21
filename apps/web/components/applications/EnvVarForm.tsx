"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { firstIssue } from "@/lib/validation/auth";
import { envVarSchema } from "@/lib/validation/env-var";

export function EnvVarForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const ids = { key: useId(), value: useId(), build: useId() };
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [isBuildTime, setIsBuildTime] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = envVarSchema.safeParse({ key, value, isBuildTime });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}/env-vars`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `The panel answered ${response.status}.`);
        return;
      }
      setKey("");
      setValue("");
      setIsBuildTime(false);
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
      <div className="server-form__row">
        <div className="field">
          <label className="field__label" htmlFor={ids.key}>
            Name
          </label>
          <input
            className="field__input"
            id={ids.key}
            value={key}
            onChange={(event) => setKey(event.target.value.toUpperCase())}
            placeholder="DATABASE_URL"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={ids.value}>
            Value
          </label>
          <input
            className="field__input"
            id={ids.value}
            type="password"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="field field--inline">
        <input
          id={ids.build}
          type="checkbox"
          checked={isBuildTime}
          onChange={(event) => setIsBuildTime(event.target.checked)}
        />
        <label className="field__label" htmlFor={ids.build}>
          Also available at build time
        </label>
      </div>

      <div className="form__actions">
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save variable"}
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
