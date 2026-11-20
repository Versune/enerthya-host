import type { Metadata } from "next";

import { AuthForm } from "@/components/AuthForm";
import { AuthScreen } from "@/components/AuthScreen";
import { Notice } from "@/components/Notice";
import { accountExists } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create the administrator — Enerthya Host",
};

export default async function SetupPage() {
  let exists = false;
  let unavailable = false;
  let reason = "";
  try {
    exists = await accountExists();
  } catch (error) {
    unavailable = true;
    reason = error instanceof Error ? error.message : "the account record is unreadable";
  }

  if (exists) {
    return (
      <AuthScreen
        title="An administrator already exists."
        lede="Setup runs once. This machine already has its account, and this screen refuses to create a second one."
        ledgerTitle="What you can do"
        ledgerFoot="To start over, delete the account record in the state directory on the host"
        facts={[
          {
            term: "Sign in",
            detail: "Use the account that exists on this machine.",
          },
          {
            term: "Reset",
            detail:
              "Delete `panel-account.json` from the state directory, then open this screen again.",
          },
          {
            term: "No web reset",
            detail:
              "There is deliberately no password reset over the network; the host is the authority.",
          },
        ]}
      >
        <div className="form">
          <div className="form__actions">
            <a className="btn" href="/">
              Go to sign in
            </a>
          </div>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Create the administrator."
      lede="This is the only account setup creates. It exists on this machine, not in a cloud account, and the password you choose here is the only way in."
      ledgerTitle="What setup will not ask for"
      ledgerFoot="First run only · once an account exists this screen refuses to run again"
      facts={[
        {
          term: "No email",
          detail: "No verification message, no reset link, no mailing list. The form has one job.",
        },
        {
          term: "No cloud account",
          detail:
            "The panel never contacts an identity provider. This machine is the authority for who may sign in.",
        },
        {
          term: "No recovery key",
          detail:
            "Losing the password means deleting the account record on the host — a deliberate trade, not an oversight.",
        },
      ]}
    >
      {unavailable ? (
        <Notice title="The account record cannot be read.">
          {reason}. Check that the state directory is owned by this user.
        </Notice>
      ) : null}

      <AuthForm mode="setup" />
    </AuthScreen>
  );
}
