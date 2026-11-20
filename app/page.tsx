import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AuthForm } from "@/components/AuthForm";
import { AuthScreen } from "@/components/AuthScreen";
import { Notice } from "@/components/Notice";
import { SignOut } from "@/components/SignOut";
import { accountExists } from "@/lib/accounts";
import { readSession, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in — Enerthya Host",
};

export default async function SignInPage() {
  const jar = await cookies();
  const session = await readSession(jar.get(SESSION_COOKIE)?.value);

  if (session) {
    return (
      <AuthScreen
        title={`Signed in as ${session.username}.`}
        lede="This browser holds a signed session for this install. The cookie is HttpOnly, SameSite=Strict and expires in eight hours."
        ledgerTitle="What this session is"
        ledgerFoot="Nothing leaves this machine · sign out clears the cookie"
        facts={[
          {
            term: "Local",
            detail: "The session is signed with a key stored in this deployment's state directory.",
          },
          {
            term: "Bounded",
            detail: "Eight hours, then the panel asks again. Signing out ends it immediately.",
          },
          {
            term: "One account",
            detail: "This install has exactly one administrator; team accounts are the next stage.",
          },
        ]}
      >
        <div className="form">
          <div className="form__actions">
            <SignOut />
          </div>
        </div>
      </AuthScreen>
    );
  }

  let exists = false;
  let unavailable = false;
  let reason = "";
  try {
    exists = await accountExists();
  } catch (error) {
    unavailable = true;
    reason = error instanceof Error ? error.message : "the account record is unreadable";
  }
  const noAccount = !unavailable && !exists;

  return (
    <AuthScreen
      title="Sign in to this install."
      lede="One account lives on this machine. There is no email address to reset it with, and no second way in."
      ledgerTitle="What this panel is"
      ledgerFoot="Interface and local account · engine calls stay on this host"
      facts={[
        {
          term: "Local",
          detail:
            "The account is hashed into this deployment's state directory. Nothing is sent anywhere.",
        },
        {
          term: "No recovery",
          detail:
            "A lost password is reset from the CLI on this server, by someone with shell access to it.",
        },
        {
          term: "Loopback",
          detail:
            "Binds to 127.0.0.1 by default. Exposing the panel to a network is a decision you make, not one it makes for you.",
        },
      ]}
    >
      {noAccount ? (
        <Notice title="No administrator exists on this machine.">
          Run first-run setup to create it.{" "}
          <a className="link" href="/setup">
            Create the administrator
          </a>
        </Notice>
      ) : null}

      {unavailable ? (
        <Notice title="The panel cannot reach the engine.">
          {reason}. Check that the state directory is readable and owned by this user.
        </Notice>
      ) : null}

      <AuthForm mode="login" />
    </AuthScreen>
  );
}
