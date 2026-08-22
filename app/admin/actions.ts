"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";
import { minimalPreset } from "@/lib/theme/presets";

// The Owner approves/removes members but has no control over
// portfolio content (per the role spec) — these actions only ever
// touch Member.status, never Portfolio content.

async function guardTarget(memberId: string, actingOwnerId: string) {
  if (memberId === actingOwnerId) {
    throw new Error("Owner cannot change their own status.");
  }
  const target = await prisma.member.findUnique({ where: { id: memberId } });
  if (!target) throw new Error("Member not found.");
  if (target.isOwner) throw new Error("Cannot change another owner's status.");
  return target;
}

export async function approveMember(memberId: string) {
  const owner = await requireOwner();
  await guardTarget(memberId, owner.id);

  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: "APPROVED",
      portfolio: {
        connectOrCreate: {
          where: { memberId },
          create: { themeConfig: minimalPreset as unknown as Prisma.InputJsonValue, sectionOrder: [] },
        },
      },
    },
  });

  revalidatePath("/admin");
}

export async function rejectMember(memberId: string) {
  const owner = await requireOwner();
  await guardTarget(memberId, owner.id);
  await prisma.member.update({ where: { id: memberId }, data: { status: "REJECTED" } });
  revalidatePath("/admin");
}

export async function revokeMember(memberId: string) {
  const owner = await requireOwner();
  await guardTarget(memberId, owner.id);
  await prisma.member.update({ where: { id: memberId }, data: { status: "REVOKED" } });
  revalidatePath("/admin");
}
