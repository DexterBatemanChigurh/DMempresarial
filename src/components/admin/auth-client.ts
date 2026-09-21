"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

/** Cliente de autenticação do navegador. Fala com /api/auth na própria origem. */
export const authClient = createAuthClient({
  plugins: [twoFactorClient()],
});
