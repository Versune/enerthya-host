"use client";

import { organizationClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Browser-side auth. Same origin as the panel, so no baseURL is configured:
 * the client talks to /api/auth on whatever host served the page.
 */
export const authClient = createAuthClient({
  plugins: [organizationClient(), twoFactorClient()],
});
