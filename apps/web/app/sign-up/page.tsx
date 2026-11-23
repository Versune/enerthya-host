import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/AuthScreen";
import { SignUpForm } from "@/components/SignUpForm";
import { getAuth } from "@/lib/auth";
import { signUpOpenFor } from "@/lib/registration";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account — Enerthya Host",
};

export default async function SignUpPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (session) redirect("/");

  if (!(await signUpOpenFor())) {
    return (
      <AuthScreen
        title="Registration is closed."
        lede="This install already has its account. A new one is created by invitation: an owner of the organization adds your address in Members, and the link that arrives is the way in."
        ledgerTitle="Why this door is shut"
        ledgerFoot="Invitations only"
        facts={[
          {
            term: "The first account",
            detail:
              "Creating the first account claims the machine. After that, anyone who could sign up would create an organization on this hardware.",
          },
          {
            term: "Invited?",
            detail:
              "Open the invitation link you received; it carries the address the account must use.",
          },
          {
            term: "No invitation",
            detail: "Ask an owner or admin of this install to invite you from the Members screen.",
          },
        ]}
      >
        <p className="status">
          <strong>Already have an account?</strong>
          <Link href="/sign-in">Sign in</Link>
        </p>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Create the first account."
      lede="The account and its organization are written to this install's database. Nothing leaves the machine to create them."
      ledgerTitle="What setup will not ask for"
      ledgerFoot="First run only · team invitations arrive with the members screen"
      facts={[
        {
          term: "No email step",
          detail:
            "No verification message and no reset link until mail is configured; the password is the way in.",
        },
        {
          term: "Organization",
          detail:
            "Servers, projects and members belong to a team. The first account owns the one created here.",
        },
        {
          term: "Roles",
          detail:
            "owner, admin and member. Invitations and role changes land with the members screen.",
        },
      ]}
    >
      <SignUpForm />
    </AuthScreen>
  );
}
