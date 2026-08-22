"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApprovedMember } from "@/lib/auth/session";

// Everything a member says about themselves — profile text, the
// project list, social links. Separate from actions.ts (theme/canvas/
// uploads) purely for file size; same auth/validation discipline
// throughout: every mutation re-derives the member's own portfolio id
// server-side, never trusts a client-supplied portfolioId.

const profileSchema = z.object({
  displayName: z.string().trim().max(80),
  tagline: z.string().trim().max(160),
  bio: z.string().trim().max(600),
  aboutLong: z.string().trim().max(8000),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export async function saveProfile(input: ProfileInput) {
  const member = await requireApprovedMember();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile." };
  }

  await prisma.portfolio.update({
    where: { memberId: member.id },
    data: {
      displayName: parsed.data.displayName || null,
      tagline: parsed.data.tagline || null,
      bio: parsed.data.bio || null,
      aboutLong: parsed.data.aboutLong || null,
    },
  });

  revalidatePath("/dashboard");
  if (member.username) revalidatePath(`/@${member.username}`);
  return { error: null };
}

const urlOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Links must start with http:// or https://.");

// url is same-origin only ("/uploads/media/...", from
// uploadProjectMedia in actions.ts) — never a member-supplied
// arbitrary URL, so no protocol check needed here.
const mediaSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(["image", "video"]),
  url: z.string().trim().min(1).max(500),
  durationSeconds: z.number().min(0).max(3600).nullable(),
});

const projectSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1, "Every project needs a title.").max(120),
  description: z.string().trim().max(2000),
  role: z.string().trim().max(120),
  technologies: z.array(z.string().trim().max(40)).max(20),
  collaborators: z.array(z.string().trim().max(60)).max(20),
  githubUrl: urlOrEmpty,
  demoUrl: urlOrEmpty,
  researchUrl: urlOrEmpty,
  media: z.array(mediaSchema).max(12, "At most 12 media items per project."),
});

export type ProjectInput = z.infer<typeof projectSchema>;

const projectsSchema = z.array(projectSchema).max(60);

// Full-replace on save, same strategy as canvas elements — the
// dashboard sends the whole authoritative list every time, so a
// delete+recreate transaction is simpler and safer than diffing
// adds/edits/removals/reorders by hand. Returns the saved rows (with
// DB-assigned ids) so the client can sync its local state.
export async function saveProjects(projects: ProjectInput[]) {
  const member = await requireApprovedMember();

  const validated = projectsSchema.safeParse(projects);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Invalid project.", data: null };
  }

  const portfolio = await prisma.portfolio.findUnique({ where: { memberId: member.id }, select: { id: true } });
  if (!portfolio) {
    return { error: "No portfolio found.", data: null };
  }

  const saved = await prisma.$transaction(async (tx) => {
    // Deleting a project cascades to its Media rows (see
    // prisma/schema.prisma) — no separate cleanup needed for whatever
    // media the old project list had.
    await tx.project.deleteMany({ where: { portfolioId: portfolio.id } });
    const rows = [];
    for (let i = 0; i < validated.data.length; i++) {
      const p = validated.data[i];
      const row = await tx.project.create({
        data: {
          portfolioId: portfolio.id,
          title: p.title,
          description: p.description || null,
          role: p.role || null,
          technologies: p.technologies,
          collaborators: p.collaborators,
          githubUrl: p.githubUrl || null,
          demoUrl: p.demoUrl || null,
          researchUrl: p.researchUrl || null,
          order: i,
        },
      });

      const media = [];
      for (let j = 0; j < p.media.length; j++) {
        const m = p.media[j];
        const mediaRow = await tx.media.create({
          data: {
            projectId: row.id,
            type: m.type === "video" ? "VIDEO" : "IMAGE",
            url: m.url,
            durationSeconds: m.durationSeconds,
            order: j,
          },
        });
        media.push({ id: mediaRow.id, type: m.type, url: mediaRow.url, durationSeconds: mediaRow.durationSeconds });
      }

      rows.push({ ...row, media });
    }
    return rows;
  });

  revalidatePath("/dashboard");
  if (member.username) revalidatePath(`/@${member.username}`);
  return { error: null, data: saved };
}

const SOCIAL_PLATFORMS = [
  "INSTAGRAM",
  "GITHUB",
  "LINKEDIN",
  "X",
  "YOUTUBE",
  "BEHANCE",
  "DRIBBBLE",
  "WEBSITE",
  "EMAIL",
  "CUSTOM",
] as const;

const socialLinkSchema = z.object({
  id: z.string().min(1).max(64),
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z.string().trim().min(1, "Link can't be empty.").max(500),
});

export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

const socialLinksSchema = z.array(socialLinkSchema).max(20);

export async function saveSocialLinks(links: SocialLinkInput[]) {
  const member = await requireApprovedMember();

  const validated = socialLinksSchema.safeParse(links);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Invalid social link.", data: null };
  }

  const portfolio = await prisma.portfolio.findUnique({ where: { memberId: member.id }, select: { id: true } });
  if (!portfolio) {
    return { error: "No portfolio found.", data: null };
  }

  const saved = await prisma.$transaction(async (tx) => {
    await tx.socialLink.deleteMany({ where: { portfolioId: portfolio.id } });
    const rows = [];
    for (const link of validated.data) {
      const row = await tx.socialLink.create({
        data: { portfolioId: portfolio.id, platform: link.platform, url: link.url },
      });
      rows.push(row);
    }
    return rows;
  });

  revalidatePath("/dashboard");
  if (member.username) revalidatePath(`/@${member.username}`);
  return { error: null, data: saved };
}
