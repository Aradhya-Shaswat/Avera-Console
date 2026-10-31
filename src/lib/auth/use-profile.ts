"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/auth/client";

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  age: number | null;
  weightKg: number | null;
  maxHr: number | null;
  sleepGoalHours: number | null;
  onboardingCompleted: boolean;
  onboardingStep: number;
  createdAt: string;
  updatedAt: string;
}

export interface CachedUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified?: boolean;
}

const PROFILE_CACHE_KEY = "avera_user_profile_cache";
const USER_CACHE_KEY = "avera_auth_user_cache";

function getCachedProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedProfile(profile: UserProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch {}
}

function getCachedUser(): CachedUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: CachedUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {}
}

export function useUserProfile() {
  const { data: session, isPending: isAuthPending } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(() => getCachedProfile());
  const [cachedUser, setCachedUserLocal] = useState<CachedUser | null>(() => getCachedUser());
  const [hasResolvedInitialAuth, setHasResolvedInitialAuth] = useState(() => {
    const cp = getCachedProfile();
    const cu = getCachedUser();
    return !!(cp && cu && cp.onboardingCompleted);
  });
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      const u: CachedUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        emailVerified: session.user.emailVerified,
      };
      setCachedUserLocal(u);
      setCachedUser(u);
    } else if (!isAuthPending && session === null) {
      setCachedUserLocal(null);
      setCachedUser(null);
      setCachedProfile(null);
      setProfile(null);
      setHasResolvedInitialAuth(true);
    }
  }, [session, isAuthPending]);

  const fetchProfile = useCallback(async () => {
    const activeUser = session?.user || cachedUser;
    if (!activeUser) {
      if (!isAuthPending) {
        setHasResolvedInitialAuth(true);
      }
      return;
    }

    try {
      setIsFetchingProfile(true);
      setError(null);
      const res = await fetch("/api/profile");
      if (!res.ok) {
        if (res.status === 401) {
          setProfile(null);
          setCachedProfile(null);
          setCachedUserLocal(null);
          setCachedUser(null);
          setHasResolvedInitialAuth(true);
          return;
        }
        throw new Error(`Failed to load profile (${res.status})`);
      }
      const data = await res.json();
      setProfile(data.profile);
      setCachedProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching profile");
    } finally {
      setIsFetchingProfile(false);
      setHasResolvedInitialAuth(true);
    }
  }, [session?.user, cachedUser, isAuthPending]);

  useEffect(() => {
    if (!isAuthPending) {
      fetchProfile();
    }
  }, [isAuthPending, fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update profile");
    }

    setProfile(data.profile);
    setCachedProfile(data.profile);
    return data.profile as UserProfile;
  };

  const currentUser = session?.user ?? cachedUser;

  return {
    session,
    user: currentUser,
    profile,
    isLoading: !hasResolvedInitialAuth,
    isRevalidating: isAuthPending || isFetchingProfile,
    hasResolvedInitialAuth,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}
