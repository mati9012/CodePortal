import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Szybkie odbicie niezalogowanych od stron organizatora (bez zapytania do API).
 * To tylko UX — prawdziwą ochronę daje AuthGuard w API przy każdym żądaniu o dane.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request, { cookiePrefix: "cp" })) {
    const url = new URL("/logowanie", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/panel/:path*"] };
