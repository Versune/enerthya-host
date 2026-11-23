"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * The invitation names the address, so the account is created for exactly that
 * address: it is shown, not asked for. Signing up first establishes the
 * session, then accepting adds the account to the organization — the same two
 * steps someone with an account takes, in one form.
 */
export function InvitationSignUp({
  id,
  email,
  organizationName,
}: {
  id: string;
  email: string;
  organizationName: string;
}) {
  const router = useRouter();
  const ids = { name: useId(), password: useId() };
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("Use at least 12 characters.");
      return;
    }
    setPending(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({ name, email, password });
      if (signUpError) {
        setError(signUpError.message ?? "The panel could not create the account.");
        return;
      }

      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(
          body.error ??
            "The account was created, but the invitation could not be accepted. Reload this page and try again.",
        );
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="form" noValidate onSubmit={submit}>
      <div className="field">
        <label className="field__label" htmlFor={ids.name}>
          Your name
        </label>
        <input
          className="field__input"
          id={ids.name}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="invited-email">
          Email — the address {organizationName} invited
        </label>
        <input
          className="field__input"
          id="invited-email"
          value={email}
          readOnly
          autoComplete="email"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor={ids.password}>
          Password
        </label>
        <input
          className="field__input"
          id={ids.password}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={12}
        />
      </div>

      <div className="form__actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Creating the account…" : "Create account and join"}
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
