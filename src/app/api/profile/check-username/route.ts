import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { serverProfileRepo } from "@/lib/db/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const username = request.nextUrl.searchParams.get("username")?.trim().toLowerCase();

    if (!username || username.length < 3 || username.length > 20 || !/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json({
        valid: false,
        available: false,
        message: "Handle must be 3-20 lowercase alphanumeric characters or underscores.",
      });
    }

    const isAvailable = await serverProfileRepo.isUsernameAvailable(
      username,
      session?.user?.id
    );

    return NextResponse.json({
      valid: true,
      available: isAvailable,
      message: isAvailable ? "Handle is available" : "Handle is already taken",
    });
  } catch (error) {
    console.error("Check username error:", error);
    return NextResponse.json(
      { error: "Failed to verify username availability" },
      { status: 500 }
    );
  }
}

