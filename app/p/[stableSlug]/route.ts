import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// What printed QR codes actually encode: /p/<stableSlug>. It resolves
// to the member's *current* username and redirects there, so a
// printed QR code keeps working even after a username change.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stableSlug: string }> },
) {
  const { stableSlug } = await params;

  const portfolio = await prisma.portfolio.findUnique({
    where: { stableSlug },
    select: { member: { select: { username: true } } },
  });

  if (!portfolio?.member.username) {
    return new NextResponse("Not found", { status: 404 });
  }

  // ?src=qr tells the /@username page (the actual view-recording
  // point — see lib/analytics.ts) this visit came from a scan rather
  // than a direct link, without this route needing to record anything
  // itself and risk double-counting the same visit.
  //
  // Built from SITE_URL rather than request.url/request.nextUrl —
  // behind Railway's proxy, the request Next.js actually sees carries
  // an internal host (the same issue AUTH_TRUST_HOST/AUTH_URL fixed
  // for Auth.js), so redirecting off of it sends real visitors to a
  // dead internal address instead of the public site.
  const origin = process.env.SITE_URL ?? new URL(request.url).origin;
  return NextResponse.redirect(new URL(`/@${portfolio.member.username}?src=qr`, origin));
}
