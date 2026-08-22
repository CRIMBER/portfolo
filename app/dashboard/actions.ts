"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApprovedMember } from "@/lib/auth/session";
import { validateThemeConfig } from "@/lib/theme/validate";
import type { ThemeConfig } from "@/lib/theme/schema";
import { validateCanvasElements } from "@/lib/canvas/validate";
import type { CanvasElementData } from "@/lib/canvas/schema";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "At least 3 characters.")
  .max(30, "At most 30 characters.")
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only.");

export async function setUsername(formData: FormData) {
  const member = await requireApprovedMember();

  const parsed = usernameSchema.safeParse(formData.get("username"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid username." };
  }

  const taken = await prisma.member.findUnique({ where: { username: parsed.data } });
  if (taken && taken.id !== member.id) {
    return { error: "That username is already taken." };
  }

  await prisma.member.update({
    where: { id: member.id },
    data: { username: parsed.data },
  });

  revalidatePath("/dashboard");
  return { error: null };
}

export async function togglePublish() {
  const member = await requireApprovedMember();

  const portfolio = await prisma.portfolio.findUnique({
    where: { memberId: member.id },
    select: { published: true },
  });
  if (!portfolio) {
    return { error: "No portfolio found." };
  }

  await prisma.portfolio.update({
    where: { memberId: member.id },
    data: { published: !portfolio.published },
  });

  revalidatePath("/dashboard");
  return { error: null };
}

// The dashboard's theme studio holds a full ThemeConfig in client
// state (presets, colors, alignment, animations — everything) and
// updates its own live preview locally, with zero server round-trips,
// as the member edits. This is the single point that persists
// whatever's currently in that state. Called directly as a function
// from the client (not via a <form>), which Server Actions support.
export async function saveThemeConfig(theme: ThemeConfig) {
  const member = await requireApprovedMember();

  const validated = validateThemeConfig(theme);
  if (!validated.ok) {
    return { error: validated.error };
  }

  await prisma.portfolio.update({
    where: { memberId: member.id },
    data: { themeConfig: validated.data as unknown as Prisma.InputJsonValue },
  });

  revalidatePath("/dashboard");
  if (member.username) revalidatePath(`/@${member.username}`);
  return { error: null };
}

// The canvas builder keeps its own local element list in client
// state, separate from the theme studio's ThemeConfig state, so it
// saves independently. Full-replace on save (delete + recreate),
// mirroring how saveThemeConfig replaces the whole themeConfig blob —
// simplest correct strategy for "here's the authoritative current
// list" rather than diffing adds/edits/removals. Returns the saved
// rows (with DB-assigned ids) so the client can sync its local state.
export async function saveCanvasElements(
  elements: CanvasElementData[],
): Promise<{ error: string | null; data: CanvasElementData[] | null }> {
  const member = await requireApprovedMember();

  const validated = validateCanvasElements(elements);
  if (!validated.ok) {
    return { error: validated.error, data: null };
  }

  const portfolio = await prisma.portfolio.findUnique({ where: { memberId: member.id }, select: { id: true } });
  if (!portfolio) {
    return { error: "No portfolio found.", data: null };
  }

  const saved = await prisma.$transaction(async (tx) => {
    await tx.canvasElement.deleteMany({ where: { portfolioId: portfolio.id } });
    const rows = [];
    for (const el of validated.data) {
      const row = await tx.canvasElement.create({
        data: {
          portfolioId: portfolio.id,
          // "widget" isn't a DB CanvasElementType — it persists as TEXT
          // with content holding a JSON widget envelope instead of
          // literal text (see lib/canvas/schema.ts), and is recovered
          // on read by lib/canvas/validate.ts#parseCanvasElement.
          type: el.type === "image" ? "IMAGE" : "TEXT",
          content: el.content,
          xPct: el.xPct,
          yPx: el.yPx,
          widthPct: el.widthPct,
          heightPx: el.heightPx,
          rotationDeg: el.rotationDeg,
          zIndex: el.zIndex,
          style: (el.type === "image" ? el.imageStyle : el.textStyle) as unknown as Prisma.InputJsonValue,
          animations: el.animations as unknown as Prisma.InputJsonValue,
        },
      });
      rows.push({
        ...el,
        id: row.id,
      });
    }
    return rows;
  });

  revalidatePath("/dashboard");
  if (member.username) revalidatePath(`/@${member.username}`);
  return { error: null, data: saved };
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

// Includes a random suffix, not just memberId + timestamp — a
// multi-file selection (see uploadProjectMedia) can upload several
// files within the same millisecond, which would otherwise collide.
function uniqueFilename(memberId: string, mimeType: string): string {
  const ext = mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${memberId}-${Date.now()}-${suffix}.${ext}`;
}

// Only writes the file and hands back its URL — the theme studio
// folds that URL into its in-memory theme state (background.kind =
// "image") and persists it along with everything else on Save, so an
// upload doesn't race with other unsaved edits.
//
// Local filesystem storage — fine for this dev scaffold, but public/
// writes don't survive a serverless/production deploy. Swap this for
// the planned S3-compatible storage before shipping (see AGENTS.md /
// project key decisions).
export async function uploadBackgroundImage(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  const member = await requireApprovedMember();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { url: null, error: "Choose an image file." };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { url: null, error: "Must be a PNG, JPEG, WebP, or GIF." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { url: null, error: "Image must be under 5MB." };
  }

  const filename = uniqueFilename(member.id, file.type);
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "backgrounds");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));

  return { url: `/uploads/backgrounds/${filename}`, error: null };
}

// Same upload path as uploadBackgroundImage, separate directory —
// the canvas builder folds the returned URL into the image element's
// `content` field in local state, persisted on the next canvas save.
export async function uploadCanvasImage(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  const member = await requireApprovedMember();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { url: null, error: "Choose an image file." };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { url: null, error: "Must be a PNG, JPEG, WebP, or GIF." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { url: null, error: "Image must be under 5MB." };
  }

  const filename = uniqueFilename(member.id, file.type);
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "canvas");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));

  return { url: `/uploads/canvas/${filename}`, error: null };
}

const MAX_VIDEO_UPLOAD_BYTES = 20 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

// Same local-filesystem-storage caveat as the two uploads above.
// Video duration isn't verified here — no ffprobe in this environment
// to check it server-side, so the actual guard against oversized
// clips is the file-size cap; the editor reads duration client-side
// from the file's own metadata purely for the UI badge (see
// ProjectsPanel.tsx), which is why it's a separate field the client
// sends to saveProjects rather than something computed here.
export async function uploadProjectMedia(
  formData: FormData,
): Promise<{ url: string | null; type: "image" | "video" | null; error: string | null }> {
  const member = await requireApprovedMember();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { url: null, type: null, error: "Choose a file." };
  }

  const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);
  if (!isImage && !isVideo) {
    return { url: null, type: null, error: "Must be PNG, JPEG, WebP, GIF, MP4, or WebM." };
  }

  const maxBytes = isVideo ? MAX_VIDEO_UPLOAD_BYTES : MAX_UPLOAD_BYTES;
  if (file.size > maxBytes) {
    return { url: null, type: null, error: isVideo ? "Video must be under 20MB." : "Image must be under 5MB." };
  }

  const filename = uniqueFilename(member.id, file.type);
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "media");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));

  return { url: `/uploads/media/${filename}`, type: isVideo ? "video" : "image", error: null };
}
