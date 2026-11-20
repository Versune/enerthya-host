import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/AuthScreen";
import { SignUpForm } from "@/components/SignUpForm";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account — Enerthya Host",
};

export default async function SignUpPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (session) redirect("/");

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
