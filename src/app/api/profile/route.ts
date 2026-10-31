import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { serverProfileRepo } from "@/lib/db/server/repositories";

export const dynamic = "force-dynamic";

const UpdateProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(60).optional(),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores")
    .optional(),
  avatarUrl: z.string().url("Must be a valid URL").nullable().or(z.literal("")).optional(),
  age: z.number().int().min(10).max(120).optional(),
  weightKg: z.number().min(20).max(300).optional(),
  maxHr: z.number().int().min(80).max(250).optional(),
  sleepGoalHours: z.number().min(3).max(16).optional(),
  onboardingCompleted: z.boolean().optional(),
  onboardingStep: z.number().int().min(1).max(3).optional(),
});

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await serverProfileRepo.getOrCreateProfile({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });

    return NextResponse.json({
      user: session.user,
      profile,
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = UpdateProfileSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 422 }
      );
    }

    const updateData = { ...parsed.data };

    if (updateData.username) {
      const normalizedUsername = updateData.username.toLowerCase();
      const isAvailable = await serverProfileRepo.isUsernameAvailable(
        normalizedUsername,
        session.user.id
      );

      if (!isAvailable) {
        return NextResponse.json(
          { error: `The handle @${normalizedUsername} is already taken.` },
          { status: 409 }
        );
      }
      updateData.username = normalizedUsername;
    }

    if (updateData.avatarUrl === "") {
      updateData.avatarUrl = null;
    }

    const updated = await serverProfileRepo.updateProfile(session.user.id, updateData);

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}

