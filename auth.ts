import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { MemberStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { minimalPreset } from "@/lib/theme/presets";
import { sendNewSignupEmail } from "@/lib/email";

// Members aren't modeled as next-auth's own User/Account tables — the
// Member row in prisma/schema.prisma is the source of truth for
// identity and approval state. We use the JWT session strategy and
// sync against Member ourselves in the callbacks below, so the
// session always reflects the current status/isOwner from the
// database rather than whatever was true at the moment of sign-in.

// Dev-only stand-in for Google sign-in, so the app is clickable before
// real OAuth credentials are wired up. Never included outside
// development — see the providers array below.
const devLogin = Credentials({
  id: "dev-login",
  name: "Dev sign-in (no Google)",
  credentials: { email: { label: "Email", type: "email" } },
  async authorize(credentials) {
    const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
    if (!email) return null;
    return { id: email, email };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: process.env.NODE_ENV === "production" ? [Google] : [Google, devLogin],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      const isRealProvider = account?.provider === "google" || account?.provider === "dev-login";
      if (!isRealProvider || !user.email || !account?.providerAccountId) {
        return false;
      }

      const existing = await prisma.member.findUnique({
        where: { googleId: account.providerAccountId },
      });

      if (existing) {
        // REVOKED/REJECTED members can still complete the OAuth
        // handshake — the status check happens where it matters
        // (every mutating route, via requireApprovedMember). We
        // don't block sign-in itself so they can see their status.
        return true;
      }

      // First Google account to sign in with this email is
      // auto-approved and made Platform Owner. Meant for one-time
      // bootstrap; clear OWNER_EMAIL after the first real owner
      // sign-in so later sign-ins don't accidentally re-grant it.
      const isOwnerEmail =
        !!process.env.OWNER_EMAIL &&
        user.email.toLowerCase() === process.env.OWNER_EMAIL.toLowerCase();

      await prisma.member.create({
        data: {
          googleId: account.providerAccountId,
          email: user.email,
          status: isOwnerEmail ? "APPROVED" : "PENDING",
          isOwner: isOwnerEmail,
          portfolio: isOwnerEmail
            ? {
                create: {
                  themeConfig: minimalPreset as unknown as Prisma.InputJsonValue,
                  sectionOrder: [],
                },
              }
            : undefined,
        },
      });

      if (!isOwnerEmail) {
        const ownerMember = await prisma.member.findFirst({ where: { isOwner: true }, select: { email: true } });
        if (ownerMember) await sendNewSignupEmail(ownerMember.email, user.email);
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.googleId = account.providerAccountId;
      }

      if (typeof token.googleId !== "string") {
        return token;
      }

      // Re-read on every call (not just at sign-in) so an approval,
      // rejection, or revocation the Owner makes takes effect on the
      // member's very next request instead of waiting for re-login.
      const member = await prisma.member.findUnique({
        where: { googleId: token.googleId },
        select: { id: true, status: true, isOwner: true, username: true },
      });

      if (member) {
        token.memberId = member.id;
        token.status = member.status;
        token.isOwner = member.isOwner;
        token.username = member.username;
      }

      return token;
    },
    async session({ session, token }) {
      if (typeof token.memberId === "string") {
        session.member = {
          id: token.memberId,
          status: token.status as MemberStatus,
          isOwner: token.isOwner as boolean,
          username: (token.username as string | null) ?? null,
        };
      }
      return session;
    },
  },
});
