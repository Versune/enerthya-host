import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/AuthScreen";
import { SignInForm } from "@/components/SignInForm";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in — Enerthya Host",
};

export default async function SignInPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (session) redirect("/");

  return (
    <AuthScreen
      title="Sign in to this install."
      lede="Accounts live in this deployment's own database. There is no cloud identity provider and no third-party request."
      ledgerTitle="What this panel is"
      ledgerFoot="Interface and local account · engine calls stay on this host"
      facts={[
        {
          term: "Self-hosted",
          detail:
            "Users, sessions and organizations are rows in this install's Postgres, not records on someone else's service.",
        },
        {
          term: "Sessions",
          detail:
            "HttpOnly cookies signed by better-auth, eight hours, ended immediately by signing out.",
        },
        {
          term: "Loopback",
          detail:
            "Binds to 127.0.0.1 by default. Exposing the panel is a decision you make, not one it makes for you.",
        },
      ]}
    >
      <SignInForm />
    </AuthScreen>
  );
}
