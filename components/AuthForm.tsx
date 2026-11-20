"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

type Mode = "login" | "setup";

const MIN_PASSWORD = 12;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const usernameId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const hintId = useId();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ username?: string; password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const longEnough = password.length >= MIN_PASSWORD;

  const validate = () => {
    const next: typeof errors = {};
    if (username.trim().length < 3) next.username = "Use at least 3 characters.";

    if (mode === "setup") {
      if (!longEnough) next.password = `Use at least ${MIN_PASSWORD} characters.`;
      if (confirm !== password) next.confirm = "The two passwords do not match.";
    } else if (password.length === 0) {
      next.password = "Enter your password.";
    }

    setErrors(next);

    const order: Array<[keyof typeof next, React.RefObject<HTMLInputElement | null>]> = [
      ["username", usernameRef],
      ["password", passwordRef],
      ["confirm", confirmRef],
    ];
    const failing = order.filter(([key]) => next[key]);
    failing[0]?.[1].current?.focus();
    return failing;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    if (validate().length > 0) {
      setErrors((current) => current);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(mode === "setup" ? "/api/setup" : "/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        router.replace("/");
        router.refresh();
        return;
      }

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setServerError(
        data.error ??
          (response.status === 503
            ? "The enerthya-host CLI is not available to the panel process."
            : "The request was refused."),
      );
    } catch {
      setServerError("The panel process did not answer. Check that it is still running.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" noValidate onSubmit={onSubmit}>
      <div className="field">
        <label className="field__label" htmlFor={usernameId}>
          Username
        </label>
        <input
          className="field__input"
          id={usernameId}
          name="username"
          type="text"
          ref={usernameRef}
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          aria-invalid={errors.username ? "true" : undefined}
          aria-describedby={errors.username ? `${usernameId}-error` : undefined}
        />
        {errors.username ? (
          <p className="field__error" id={`${usernameId}-error`}>
            {errors.username}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={passwordId}>
          Password
        </label>
        <input
          className="field__input"
          id={passwordId}
          name="password"
          type="password"
          ref={passwordRef}
          required
          autoComplete={mode === "setup" ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={errors.password ? "true" : undefined}
          aria-describedby={
            errors.password ? `${passwordId}-error` : mode === "setup" ? hintId : undefined
          }
        />
        {mode === "setup" && !errors.password ? (
          <p className="field__hint" id={hintId} data-met={longEnough ? "true" : undefined}>
            {longEnough
              ? "12 characters or more — stored as a scrypt hash in the state directory."
              : `At least ${MIN_PASSWORD} characters — stored as a scrypt hash in the state directory.`}
          </p>
        ) : null}
        {errors.password ? (
          <p className="field__error" id={`${passwordId}-error`}>
            {errors.password}
          </p>
        ) : null}
      </div>

      {mode === "setup" ? (
        <div className="field">
          <label className="field__label" htmlFor={confirmId}>
            Confirm password
          </label>
          <input
            className="field__input"
            id={confirmId}
            name="confirm"
            type="password"
            ref={confirmRef}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            aria-invalid={errors.confirm ? "true" : undefined}
            aria-describedby={errors.confirm ? `${confirmId}-error` : undefined}
          />
          {errors.confirm ? (
            <p className="field__error" id={`${confirmId}-error`}>
              {errors.confirm}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="form__actions">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Working…" : mode === "setup" ? "Create account" : "Sign in"}
        </button>
        {mode === "setup" ? (
          <a className="link" href="/">
            Already have an account
          </a>
        ) : (
          <a className="link" href="/setup">
            First run? Create the administrator
          </a>
        )}
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
