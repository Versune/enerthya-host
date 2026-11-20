"use client";

import { useEffect, useId, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { firstIssue, signInSchema } from "@/lib/validation/auth";

export function SignInForm() {
  const ids = { email: useId(), password: useId() };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setServerError(firstIssue(parsed.error));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        setServerError(error.message ?? "Those credentials were not accepted.");
        return;
      }

      // Hard navigation so the dashboard is rendered by the server with the
      // session cookie this response just set.
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
        />
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <div className="form__actions">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
        <a className="link" href="/sign-up">
          First run? Create an account
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
