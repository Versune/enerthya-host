import * as schema from "@enerthya/db";
import { getDb } from "@enerthya/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { organization, twoFactor } from "better-auth/plugins";
import { signUpOpenFor } from "@/lib/registration";

/**
 * better-auth reads its secret and database lazily so `next build` never needs
 * a live Postgres or an ENCRYPTION_KEY. The first request that touches auth
 * pays for the pool, and a missing variable fails loudly there instead of
 * shipping a session signed with an empty key.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function createAuth() {
  const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  return betterAuth({
    appName: "Enerthya Host",
    baseURL,
    secret: required("BETTER_AUTH_SECRET"),
    trustedOrigins: [
      baseURL,
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean) ?? []),
    ],
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
        organization: schema.organizations,
        member: schema.members,
        invitation: schema.invitations,
        twoFactor: schema.twoFactors,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      // The first account claims the install; after that only an invitation
      // for the address opens the door (enforced in databaseHooks below).
      disableSignUp: false,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user: { email?: string }) => {
            const open = await signUpOpenFor(user.email);
            if (!open) {
              throw new APIError("FORBIDDEN", {
                message: "Registration is closed on this install. Ask an owner for an invitation.",
              });
            }
            return { data: user };
          },
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 60,
    },
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
        membershipLimit: 100,
      }),
      twoFactor(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let cached: Auth | undefined;

export function getAuth(): Auth {
  cached ??= createAuth();
  return cached;
}
