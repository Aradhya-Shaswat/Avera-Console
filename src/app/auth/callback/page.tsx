"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function checkSessionAndRoute() {
      for (let attempt = 0; attempt < 4; attempt++) {
        if (!active) return;
        setRetryCount(attempt);

        try {
          const sessionRes = await authClient.getSession();
          if (sessionRes?.data?.user) {
            try {
              const res = await fetch("/api/profile");
              if (res.ok) {
                const data = await res.json();
                if (data.profile?.onboardingCompleted) {
                  router.replace("/");
                  return;
                }
              }
            } catch {
            }

            router.replace("/onboarding");
            return;
          }
        } catch {
        }

        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }

      if (active) {
        router.replace("/login?error=session_missing");
      }
    }

    checkSessionAndRoute();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background select-none p-6 text-center">
      <div className="space-y-4 max-w-sm animate-fade-in">
        <h1 className="font-display text-3xl tracking-tight text-foreground font-normal">AVERA</h1>
        <div className="flex justify-center py-2">
          <div className="h-5 w-5 rounded-full border-2 border-muted border-t-foreground animate-spin" />
        </div>
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted">
          {retryCount > 1 ? "Confirming Session..." : "Loading..."}
        </p>
      </div>
    </div>
  );
}
