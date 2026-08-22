import type { MemberStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    member?: {
      id: string;
      status: MemberStatus;
      isOwner: boolean;
      username: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleId?: string;
    memberId?: string;
    status?: MemberStatus;
    isOwner?: boolean;
    username?: string | null;
  }
}
