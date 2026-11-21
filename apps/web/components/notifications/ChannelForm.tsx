"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { firstIssue } from "@/lib/validation/auth";
import { notificationSchema } from "@/lib/validation/notification";

export function ChannelForm() {
  const router = useRouter();
  const ids = { name: useId(), type: useId(), url: useId() };
  const [name, setName] = useState("");
  const [type, setType] = useState<"discord" | "webhook">("discord");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = notificationSchema.safeParse({ name, type, url });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/notifications", {
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
      setUrl("");
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
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={ids.type}>
            Type
          </label>
          <select
            className="field__input"
            id={ids.type}
            value={type}
            onChange={(event) => setType(event.target.value as "discord" | "webhook")}
          >
            <option value="discord">Discord</option>
            <option value="webhook">Webhook</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={ids.url}>
          {type === "discord" ? "Discord webhook URL" : "Endpoint URL"}
        </label>
        <input
          className="field__input"
          id={ids.url}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://discord.com/api/webhooks/…"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>

      <div className="form__actions">
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Add channel"}
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
