"use client";

import { toSlug } from "@enerthya/core";
import { useEffect, useId, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { firstIssue, signUpSchema } from "@/lib/validation/auth";

type Errors = Partial<Record<"name" | "email" | "password" | "organization", string>>;

async function createOrganization(name: string) {
  const base = toSlug(name) || "team";
  const first = await authClient.organization.create({ name, slug: base });
  if (!first.error) return first.data;

  // Slugs are global; a second team with the same name gets a short suffix.
  const retry = await authClient.organization.create({
    name,
    slug: `${base}-${Date.now().toString(36).slice(-4)}`,
  });
  return retry.data ?? null;
}

export function SignUpForm() {
  const ids = { name: useId(), email: useId(), password: useId(), organization: useId() };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    const parsed = signUpSchema.safeParse({ name, email, password, organization });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof Errors;
        next[field] ??= issue.message;
      }
      setErrors(next);
      setServerError(firstIssue(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (signUpError) {
        setServerError(signUpError.message ?? "The panel could not create the account.");
        return;
      }

      const team = await createOrganization(parsed.data.organization);
      if (team) {
        // Best effort: the dashboard falls back to the first organization, so a
        // slow activation must not hold the user on the form.
        void authClient.organization.setActive({ organizationId: team.id });
      }

      // A hard navigation guarantees the server sees the new session cookie;
      // a client-side replace can be served from the pre-signup cache.
      window.location.assign("/");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="form"
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
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name ? "true" : undefined}
        />
        {errors.name ? <p className="field__error">{errors.name}</p> : null}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={ids.email}>
          Email
        </label>
        <input
          className="field__input"
          id={ids.email}
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={errors.email ? "true" : undefined}
        />
        {errors.email ? <p className="field__error">{errors.email}</p> : null}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={ids.password}>
          Password
        </label>
        <input
          className="field__input"
          id={ids.password}
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={errors.password ? "true" : undefined}
        />
        <p className="field__hint" data-met={password.length >= 12 ? "true" : undefined}>
          At least 12 characters — hashed by better-auth, never stored in the clear.
        </p>
        {errors.password ? <p className="field__error">{errors.password}</p> : null}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={ids.organization}>
          Organization
        </label>
        <input
          className="field__input"
          id={ids.organization}
          name="organization"
          type="text"
          autoComplete="organization"
          value={organization}
          onChange={(event) => setOrganization(event.target.value)}
          aria-invalid={errors.organization ? "true" : undefined}
        />
        <p className="field__hint">Servers, projects and members belong to this team.</p>
        {errors.organization ? <p className="field__error">{errors.organization}</p> : null}
      </div>

      <div className="form__actions">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create account"}
        </button>
        <a className="link" href="/sign-in">
          Already have an account
        </a>
      </div>

      {serverError ? (
        <p className="status" role="alert">
          <strong>The panel refused the request.</strong>
          {serverError}
        </p>
      ) : null}
    </form>
  );
}
