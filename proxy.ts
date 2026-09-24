import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  // The feed and post pages are readable by anyone; per-post visibility
  // (published vs. private) is enforced inside those pages, not here.
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/" ||
    pathname === "/albums" ||
    pathname.startsWith("/post/") ||
    pathname.startsWith("/album/");

  if (!req.auth && !isPublic) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
