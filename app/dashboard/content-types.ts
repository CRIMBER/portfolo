// Client-side editable shapes for the content panels — technologies/
// collaborators are edited as comma-separated text (simpler than a
// tag-input widget) and only split into arrays on save; see
// content-actions.ts for the persisted shape.

export const SOCIAL_PLATFORMS = [
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

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface EditableProfile {
  displayName: string;
  tagline: string;
  bio: string;
  aboutLong: string;
}

export interface EditableMedia {
  id: string;
  type: "image" | "video";
  url: string;
  durationSeconds: number | null;
}

export interface EditableProject {
  id: string;
  title: string;
  description: string;
  role: string;
  technologiesText: string;
  collaboratorsText: string;
  githubUrl: string;
  demoUrl: string;
  researchUrl: string;
  media: EditableMedia[];
}

// "8:05" for anything an hour+, "0:08" otherwise — durations here are
// short clips (see uploadProjectMedia's size cap), never long enough
// to need an hours place.
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface EditableSocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
}

export function splitList(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function newLocalId(): string {
  return `local-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
