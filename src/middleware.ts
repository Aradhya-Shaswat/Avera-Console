import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/login",
  publicRoutes: ["/login", "/auth/callback", "/api/auth", "/api/sync"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
