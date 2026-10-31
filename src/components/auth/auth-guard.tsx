"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/lib/auth/use-profile";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, hasResolvedInitialAuth } = useUserProfile();
  const hasAuthenticated = useRef(false);

  if (user && profile?.onboardingCompleted) {
    hasAuthenticated.current = true;
  }

  useEffect(() => {
    if (!hasResolvedInitialAuth) return;

    if (!user) {
      hasAuthenticated.current = false;
      router.replace("/login");
      return;
    }

    if (profile && !profile.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [user, profile, hasResolvedInitialAuth, router]);

  if (hasAuthenticated.current) {
    return <>{children}</>;
  }

  if (!hasResolvedInitialAuth || !user || (profile && !profile.onboardingCompleted)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-muted border-t-foreground animate-spin" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted">
            Verifying session...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
