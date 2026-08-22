import type { MemberStatus } from "@prisma/client";
import { auth } from "@/auth";

export interface AuthedMember {
  id: string;
  status: MemberStatus;
  isOwner: boolean;
  username: string | null;
}

export async function getSessionMember(): Promise<AuthedMember | null> {
  const session = await auth();
  return session?.member ?? null;
}

// Guards for the top of Server Actions and Route Handlers. Every
// mutating route must call one of these before touching data — the
// approval status check has to happen server-side, not just in the
// UI (see project instructions).

export class AuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "NOT_APPROVED" | "NOT_OWNER") {
    super(code);
  }
}

export async function requireApprovedMember(): Promise<AuthedMember> {
  const member = await getSessionMember();
  if (!member) throw new AuthError("UNAUTHENTICATED");
  if (member.status !== "APPROVED") throw new AuthError("NOT_APPROVED");
  return member;
}

export async function requireOwner(): Promise<AuthedMember> {
  const member = await getSessionMember();
  if (!member) throw new AuthError("UNAUTHENTICATED");
  if (!member.isOwner) throw new AuthError("NOT_OWNER");
  return member;
}
