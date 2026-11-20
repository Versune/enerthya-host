"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { firstIssue } from "@/lib/validation/auth";
import { serverSchema } from "@/lib/validation/server";

export function ServerForm() {
  const router = useRouter();
  const ids = {
    name: useId(),
    host: useId(),
    port: useId(),
    username: useId(),
    key: useId(),
  };

  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("root");
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = serverSchema.safeParse({ name, host, port, username, privateKey });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/servers", {
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
      setHost("");
      setPort("22");
      setUsername("root");
      setPrivateKey("");
      router.refresh();
    } finally {
      setSubmitting(false);
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
        <label className="field__label" htmlFor={ids.name}>
          Name
        </label>
        <input
          className="field__input"
          id={ids.name}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="server-form__row">
        <div className="field">
          <label className="field__label" htmlFor={ids.host}>
            Host
          </label>
          <input
            className="field__input"
            id={ids.host}
            value={host}
            onChange={(event) => setHost(event.target.value)}
            autoCapitalize="none"
            spellCheck={false}
            placeholder="203.0.113.10"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor={ids.port}>
            Port
          </label>
          <input
            className="field__input"
            id={ids.port}
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={(event) => setPort(event.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor={ids.username}>
            SSH user
          </label>
          <input
            className="field__input"
            id={ids.username}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={ids.key}>
          Private key
        </label>
        <textarea
          className="field__input field__input--area"
          id={ids.key}
          rows={5}
          value={privateKey}
          onChange={(event) => setPrivateKey(event.target.value)}
          placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
          spellCheck={false}
        />
        <p className="field__hint">
          Stored encrypted with AES-256-GCM. It is never returned by the API.
        </p>
      </div>

      <div className="form__actions">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add server"}
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
