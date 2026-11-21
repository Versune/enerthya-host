"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { firstIssue } from "@/lib/validation/auth";
import { projectSchema } from "@/lib/validation/project";

export function ProjectForm() {
  const router = useRouter();
  const ids = { name: useId(), description: useId() };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = projectSchema.safeParse({ name, description });
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
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
      setDescription("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="form project-form"
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

      <div className="field">
        <label className="field__label" htmlFor={ids.description}>
          Description
        </label>
        <input
          className="field__input"
          id={ids.description}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          autoComplete="off"
        />
        <p className="field__hint">
          Optional. Production and staging are created with the project.
        </p>
      </div>

      <div className="form__actions">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create project"}
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
