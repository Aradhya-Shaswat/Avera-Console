"use client";

import { createAuthClient } from "@neon/auth/next";

export const authClient = createAuthClient();
export const { signIn, signOut, useSession, emailOtp } = authClient;

