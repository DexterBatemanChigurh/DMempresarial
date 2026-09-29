"use client";

import { createAuthClient } from "better-auth/react";

/** Cliente de autenticação do navegador. Fala com /api/auth na própria origem. */
export const authClient = createAuthClient();
