import { NextResponse, type NextRequest } from "next/server";

// Next.js reserves folder names starting with "@" for parallel
// routes, so the literal /@username public URL can't be a real route
// folder. We rewrite it to /u/[username] instead, which is where the
// actual page lives.
//
// This only rewrites — no DB access here. The proxy runs on the Edge
// runtime, which Prisma's Node engine doesn't support, so all
// approval/ownership checks happen in the page/action itself instead.
const HANDLE_PATTERN = /^\/@([^/]+)(\/.*)?$/;

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(HANDLE_PATTERN);
  if (!match) {
    return NextResponse.next();
  }

  const [, username, rest] = match;
  const url = request.nextUrl.clone();
  url.pathname = `/u/${username}${rest ?? ""}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Broad matcher, excluding Next.js internals/static assets/API routes;
  // the actual "/@handle" check happens in the function body above.
  // (The narrower literal pattern "/@:path*" silently failed to match.)
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
};
