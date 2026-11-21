"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { firstIssue } from "@/lib/validation/auth";
import { managedDatabaseSchema } from "@/lib/validation/database";

type EnvironmentOption = { id: string; label: string };

export function DatabaseForm({ environments }: { environments: EnvironmentOption[] }) {
  const router = useRouter();
  const ids = { name: useId(), environment: useId(), version: useId() };
  const [name, setName] = useState("");
  const [environmentId, setEnvironmentId] = useState(environments[0]?.id ?? "");
  const [version, setVersion] = useState<"17" | "16">("17");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = managedDatabaseSchema.safeParse({ name, environmentId, version });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/databases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `The panel answered ${response.status}.`);
        return;
      }
      setName("");
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
          <label className="field__label" htmlFor={ids.name}>
            Name
          </label>
          <input
            className="field__input"
            id={ids.name}
            value={name}
            onChange={(event) => setName(event.target.value.toLowerCase())}
            placeholder="app-db"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={ids.environment}>
            Environment
          </label>
          <select
            className="field__input"
            id={ids.environment}
            value={environmentId}
            onChange={(event) => setEnvironmentId(event.target.value)}
          >
            {environments.map((environment) => (
              <option key={environment.id} value={environment.id}>
                {environment.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={ids.version}>
            Postgres
          </label>
          <select
            className="field__input"
            id={ids.version}
            value={version}
            onChange={(event) => setVersion(event.target.value as "17" | "16")}
          >
            <option value="17">17</option>
            <option value="16">16</option>
          </select>
        </div>
      </div>

      <div className="form__actions">
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create database"}
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
