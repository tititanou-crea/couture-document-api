import { TOKEN_COOKIE } from "@/services/api";
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = new Set(["/", "/login"]);
const adminRoutes = ["/volunteers"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const session = token ? readSession(token) : null;

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!publicRoutes.has(pathname) && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    session &&
    adminRoutes.some((route) => pathname.startsWith(route)) &&
    session.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|illustrations).*)"],
};

function readSession(token: string): { role?: string } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number; role?: string };
    if (!payload.role) return null;
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
