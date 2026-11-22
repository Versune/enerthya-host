"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

type Member = { id: string; userId: string; role: string; user: { name: string; email: string } };
type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date | string;
};

export function MembersManager({
  members,
  invitations,
  canWrite,
  currentUserId,
}: {
  members: Member[];
  invitations: Invitation[];
  canWrite: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const ids = { email: useId(), role: useId() };
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const call = async (input: string, init: RequestInit, ok: string) => {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(input, init);
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? `The panel answered ${response.status}.`);
        return;
      }
      setNotice(ok);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="stack">
      {canWrite ? (
        <form
          className="form server-form"
          noValidate
          onSubmit={async (event) => {
            event.preventDefault();
            await call(
              "/api/members",
              {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, role }),
              },
              `Invitation recorded for ${email}.`,
            );
            setEmail("");
          }}
        >
          <div className="schedule-form__row">
            <div className="field">
              <label className="field__label" htmlFor={ids.email}>
                Address
              </label>
              <input
                className="field__input"
                id={ids.email}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor={ids.role}>
                Role
              </label>
              <select
                className="field__input"
                id={ids.role}
                value={role}
                onChange={(event) => setRole(event.target.value as "admin" | "member")}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="form__actions">
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Sending…" : "Invite"}
            </button>
          </div>
          <p className="field__hint">
            The invitation is recorded even without a relay; the worker logs that it skipped the
            email, and the link can be passed by hand.
          </p>
        </form>
      ) : null}

      {notice ? (
        <p className="field__hint" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="status" role="alert">
          <strong>The panel refused the request.</strong>
          {error}
        </p>
      ) : null}

      <ul className="projects">
        {members.map((member) => (
          <li className="project" key={member.id}>
            <div className="project__id">
              <span className="project__name">
                {member.user.name}
                {member.userId === currentUserId ? " (you)" : ""}
              </span>
              <span className="project__description">{member.user.email}</span>
            </div>
            <span className="env-chip">{member.role}</span>
            {canWrite && member.role !== "owner" ? (
              <span className="server__actions">
                <select
                  className="field__input"
                  aria-label={`Role for ${member.user.email}`}
                  value={member.role}
                  disabled={pending}
                  onChange={(event) =>
                    void call(
                      "/api/members/role",
                      {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ memberId: member.id, role: event.target.value }),
                      },
                      "Role updated.",
                    )
                  }
                >
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
                <button
                  className="btn btn--quiet"
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    void call(
                      `/api/members?member=${member.id}`,
                      { method: "DELETE" },
                      "Member removed.",
                    )
                  }
                >
                  Remove
                </button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {invitations.length > 0 ? (
        <>
          <h2 className="label">Pending invitations</h2>
          <ul className="projects">
            {invitations.map((invitation) => (
              <li className="project" key={invitation.id}>
                <div className="project__id">
                  <span className="project__name">{invitation.email}</span>
                  <span className="project__description">
                    {invitation.role} · {invitation.status} · expires{" "}
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                {canWrite ? (
                  <span className="server__actions">
                    <button
                      className="btn btn--quiet"
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        void call(
                          `/api/members/invitations?id=${invitation.id}`,
                          { method: "DELETE" },
                          "Invitation cancelled.",
                        )
                      }
                    >
                      Cancel
                    </button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
