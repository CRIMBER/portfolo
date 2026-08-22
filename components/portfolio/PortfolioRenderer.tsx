import type { CSSProperties } from "react";
import type { ThemeConfig } from "@/lib/theme/schema";
import { themeToStyle } from "@/lib/theme/css-vars";
import { googleFontsHref } from "@/lib/theme/google-fonts";
import { findPreset, intensityScale } from "@/lib/theme/animation";
import { parseColor } from "@/lib/theme/color";
import { ScrollChoreographyGroup, ScrollChoreographyItem, type ScrollRevealVariant } from "./ScrollChoreography";
import { CursorTrail, type CursorVariant } from "./CursorTrail";
import { ParallaxLayer, type ParallaxVariant } from "./ParallaxLayer";
import { Particles, type ParticlesVariant } from "./Particles";
import { TextReveal, type TextRevealVariant } from "./TextReveal";
import { Magnetic } from "./Magnetic";
import { Ripple } from "./Ripple";
import { PopOnClick } from "./PopOnClick";
import { ScrollbarTheme } from "./ScrollbarTheme";
import { CanvasLayer } from "@/components/canvas/CanvasLayer";
import type { CanvasElementData } from "@/lib/canvas/schema";
import { IntroOverlay } from "@/components/intro/IntroOverlay";
import { ShowcaseReel } from "./ShowcaseReel";
import { ProjectGallery } from "./ProjectGallery";
import styles from "./renderer.module.css";

export interface PortfolioMedia {
  id: string;
  type: "image" | "video";
  url: string;
  durationSeconds: number | null;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string | null;
  role: string | null;
  technologies: string[];
  githubUrl: string | null;
  demoUrl: string | null;
  researchUrl?: string | null;
  collaborators?: string[];
  media?: PortfolioMedia[];
}

// Both page.tsx routes (dashboard preview + public /@username) read
// Media rows straight from Prisma, whose `type` is the DB enum
// (IMAGE/VIDEO/AUDIO) — this is the one conversion point down to the
// lowercase image/video union every renderer in this file works with.
// AUDIO is a real enum value (for a future feature) but nothing in
// this gallery — upload, editor, or renderer — creates or expects it
// yet, so it's dropped here rather than given a fake visual.
export function toPortfolioMedia(rows: { id: string; type: "IMAGE" | "VIDEO" | "AUDIO"; url: string; durationSeconds: number | null }[]): PortfolioMedia[] {
  return rows
    .filter((row) => row.type !== "AUDIO")
    .map((row) => ({ id: row.id, type: row.type === "VIDEO" ? "video" : "image", url: row.url, durationSeconds: row.durationSeconds }));
}

export interface PortfolioSocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface PortfolioRendererProps {
  theme: ThemeConfig;
  handle: string;
  displayName: string | null;
  tagline: string | null;
  bio: string | null;
  aboutLong?: string | null;
  projects: PortfolioProject[];
  socialLinks: PortfolioSocialLink[];
  // false for embedded previews (e.g. the dashboard), true for the
  // standalone public page — otherwise a small preview box inflates
  // to fill the whole viewport height.
  fullHeight?: boolean;
  canvasElements?: CanvasElementData[];
  // True when this visit arrived via a QR scan (?src=qr — see
  // app/p/[stableSlug]/route.ts) rather than a direct link. Only ever
  // passed by the real public page; never true for the dashboard's
  // own live preview.
  viaQr?: boolean;
}

// Every implemented presetId per target, as a typed, bounded lookup —
// this *is* the "no arbitrary code" boundary: a member can only ever
// select one of these known keys, never supply their own behavior.
const HERO_ENTRANCE_CLASS: Record<string, string> = {
  "glitch-in": styles.glitchIn,
  "fade-scale": styles.fadeScale,
  "slide-up": styles.slideUp,
  typewriter: styles.typewriter,
  "bounce-in": styles.bounceIn,
};

const HOVER_CLASS: Record<string, string> = {
  "subtle-lift": styles.subtleLift,
  glow: styles.hoverGlow,
  tilt: styles.tilt,
  "scale-up": styles.scaleUp,
  shine: styles.shine,
};

const CARD_MOVEMENT_CLASS: Record<string, string> = {
  float: styles.float,
  orbit: styles.orbit,
  pulse: styles.pulse,
  wobble: styles.wobble,
};

const BACKGROUND_CLASS: Record<string, string> = {
  scanlines: styles.scanlines,
  "gradient-shift": styles.gradientShift,
  "noise-grain": styles.noiseGrain,
  aurora: styles.aurora,
  starfield: styles.starfield,
};

const SCROLL_REVEAL_VARIANTS = new Set(["fade-up", "slide-in-left", "zoom-in", "blur-in", "rotate-in"]);
const CURSOR_VARIANTS = new Set(["trail-glow", "dot-follow", "magnetic-ring", "spotlight"]);
const PARALLAX_VARIANTS = new Set(["layered-drift", "depth-scroll"]);
const TEXT_REVEAL_VARIANTS = new Set(["char-reveal", "wave"]);
const PARTICLES_VARIANTS = new Set([
  "floating-dots",
  "constellation",
  "snowfall",
  "embers",
  "fireflies",
  "pixels",
  "lightning",
  "smoke",
  "fog",
  "matrix-rain",
]);

// The single renderer both the public /@username page and the
// dashboard's live preview draw from (see lib/theme/schema.ts) — one
// ThemeConfig in, one rendered page out, so the two can never drift.
export function PortfolioRenderer({
  theme,
  handle,
  displayName,
  tagline,
  bio,
  aboutLong,
  projects,
  socialLinks,
  fullHeight = true,
  canvasElements = [],
  viaQr = false,
}: PortfolioRendererProps) {
  const heroEntrance = findPreset(theme.animation, "heroEntrance");
  const scrollReveal = findPreset(theme.animation, "scrollReveal");
  const hover = findPreset(theme.animation, "hover");
  const cardMovement = findPreset(theme.animation, "cardMovement");
  const background = findPreset(theme.animation, "background");
  const cursor = findPreset(theme.animation, "cursor");
  const parallax = findPreset(theme.animation, "parallax");
  const particles = findPreset(theme.animation, "particles");
  const textReveal = findPreset(theme.animation, "textReveal");
  const magnetic = findPreset(theme.animation, "magnetic");
  const microInteraction = findPreset(theme.animation, "microInteraction");

  const heroEntranceClass = heroEntrance ? HERO_ENTRANCE_CLASS[heroEntrance.presetId] : undefined;
  const hoverClass = hover ? HOVER_CLASS[hover.presetId] : undefined;
  const cardMovementClass = cardMovement ? CARD_MOVEMENT_CLASS[cardMovement.presetId] : undefined;
  const backgroundClass = background ? BACKGROUND_CLASS[background.presetId] : undefined;

  const scrollRevealVariant =
    scrollReveal && SCROLL_REVEAL_VARIANTS.has(scrollReveal.presetId)
      ? (scrollReveal.presetId as ScrollRevealVariant)
      : undefined;
  const cursorVariant =
    cursor && CURSOR_VARIANTS.has(cursor.presetId) ? (cursor.presetId as CursorVariant) : undefined;
  const parallaxVariant =
    parallax && PARALLAX_VARIANTS.has(parallax.presetId) ? (parallax.presetId as ParallaxVariant) : undefined;
  const textRevealVariant =
    textReveal && TEXT_REVEAL_VARIANTS.has(textReveal.presetId) ? (textReveal.presetId as TextRevealVariant) : undefined;
  const particlesVariant =
    particles && PARTICLES_VARIANTS.has(particles.presetId) ? (particles.presetId as ParticlesVariant) : undefined;

  const heroClassName = [styles.heroTitle, heroEntranceClass].filter(Boolean).join(" ");
  const cardClassName = [styles.card, hoverClass, cardMovementClass].filter(Boolean).join(" ");
  const pageClassName = [styles.page, fullHeight ? styles.fullHeight : "", backgroundClass]
    .filter(Boolean)
    .join(" ");

  // Not a preset — falls out of how translucent the member made their
  // surface color. See cardBackdropBlur in lib/theme/css-vars.ts.
  const isGlassy = parseColor(theme.colors.surface).alpha < 1;
  const heroWrapClassName = [styles.hero, isGlassy ? styles.heroGlass : ""].filter(Boolean).join(" ");

  const heroBlock = (
    <div className={heroWrapClassName}>
      <h1
        className={heroClassName}
        style={heroEntrance ? ({ "--tc-anim-scale": intensityScale(heroEntrance.intensity) } as CSSProperties) : undefined}
      >
        {displayName ?? `@${handle}`}
      </h1>
      {tagline &&
        (textRevealVariant ? (
          <p className={styles.tagline}>
            <TextReveal text={tagline} variant={textRevealVariant} scale={intensityScale(textReveal!.intensity)} />
          </p>
        ) : (
          <p className={styles.tagline}>{tagline}</p>
        ))}
    </div>
  );

  const projectCards = projects.map((project) => {
    let card = (
      <article className={cardClassName} key={project.id}>
        <h3 className={styles.projectTitle}>{project.title}</h3>
        {project.role && <p className={styles.projectMeta}>{project.role}</p>}
        {project.description && <p>{project.description}</p>}
        {project.technologies.length > 0 && (
          <ul className={styles.techList}>
            {project.technologies.map((tech) => (
              <li className={styles.techItem} key={tech}>
                {tech}
              </li>
            ))}
          </ul>
        )}
        {!!project.media?.length && <ProjectGallery media={project.media} />}
        {!!project.collaborators?.length && (
          <p className={styles.projectMeta}>with {project.collaborators.join(", ")}</p>
        )}
        {(project.demoUrl || project.githubUrl || project.researchUrl) && (
          <p className={styles.projectLinks}>
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer noopener">
                Demo
              </a>
            )}
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noreferrer noopener">
                Code
              </a>
            )}
            {project.researchUrl && (
              <a href={project.researchUrl} target="_blank" rel="noreferrer noopener">
                Write-up
              </a>
            )}
          </p>
        )}
      </article>
    );

    if (microInteraction?.presetId === "ripple") {
      card = (
        <Ripple scale={intensityScale(microInteraction.intensity)} key={project.id}>
          {card}
        </Ripple>
      );
    } else if (microInteraction?.presetId === "pop") {
      card = <PopOnClick key={project.id}>{card}</PopOnClick>;
    }

    if (scrollRevealVariant) {
      card = (
        <ScrollChoreographyItem variant={scrollRevealVariant} scale={intensityScale(scrollReveal!.intensity)} key={project.id}>
          {card}
        </ScrollChoreographyItem>
      );
    }

    return card;
  });

  // A QR-tagged visit prefers the member's dedicated QR-arrival
  // cutscene when they've set one; otherwise it falls back to the
  // regular intro like any other visit, rather than showing nothing.
  const activeIntro =
    viaQr && theme.qrIntro.presetId
      ? { presetId: theme.qrIntro.presetId, durationMs: theme.qrIntro.durationMs, sessionKeySuffix: "qr" }
      : theme.intro.presetId
        ? { presetId: theme.intro.presetId, durationMs: theme.intro.durationMs, sessionKeySuffix: undefined }
        : null;

  return (
    <div className={pageClassName} style={themeToStyle(theme)}>
      <link key={googleFontsHref(theme)} rel="stylesheet" href={googleFontsHref(theme)} />
      {fullHeight && <ScrollbarTheme thumb={theme.colors.primary} track={theme.colors.surface} />}
      {fullHeight && activeIntro && (
        <IntroOverlay
          presetId={activeIntro.presetId}
          durationMs={activeIntro.durationMs}
          sessionKeySuffix={activeIntro.sessionKeySuffix}
          handle={handle}
          displayName={displayName}
          tagline={tagline}
          textColor={theme.colors.text}
          accentColor={theme.colors.primary}
          backgroundColor={theme.colors.background}
          fontFamily={`"${theme.typography.headingFont}", system-ui, sans-serif`}
        />
      )}
      <div className={styles.overlay} />

      {particlesVariant && (
        <Particles scale={intensityScale(particles!.intensity)} color={theme.colors.primary} variant={particlesVariant} />
      )}
      {cursorVariant && <CursorTrail variant={cursorVariant} scale={intensityScale(cursor!.intensity)} />}

      {theme.canvasMode !== "replace" && (
        <div className={styles.content}>
          {parallaxVariant ? (
            <ParallaxLayer variant={parallaxVariant} factor={0.06 * intensityScale(parallax!.intensity)} enabled={fullHeight}>
              {heroBlock}
            </ParallaxLayer>
          ) : (
            heroBlock
          )}

          {(aboutLong ?? bio) && <p className={styles.bio}>{aboutLong ?? bio}</p>}

          {projectCards.length > 0 && (
            <section>
              <h2 className={styles.sectionHeading}>Projects</h2>
              {theme.reel.enabled && projects.length >= 2 && (
                <ShowcaseReel
                  projects={projects}
                  transitionPresetId={theme.reel.transitionPresetId}
                  autoAdvanceMs={theme.reel.autoAdvanceMs}
                  textColor={theme.colors.text}
                  mutedColor={theme.colors.textMuted}
                  accentColor={theme.colors.primary}
                  backgroundColor={theme.colors.background}
                />
              )}
              {scrollRevealVariant ? (
                <ScrollChoreographyGroup scale={intensityScale(scrollReveal!.intensity)}>
                  <div className={styles.projectsGrid}>{projectCards}</div>
                </ScrollChoreographyGroup>
              ) : (
                <div className={styles.projectsGrid}>{projectCards}</div>
              )}
            </section>
          )}

          {socialLinks.length > 0 && (
            <ul className={styles.socialList}>
              {socialLinks.map((link) => {
                const anchor = (
                  <a className={styles.socialLink} href={link.url} target="_blank" rel="noreferrer noopener">
                    {link.platform}
                  </a>
                );
                return (
                  <li key={link.id}>
                    {magnetic?.presetId === "pull" ? (
                      <Magnetic scale={intensityScale(magnetic.intensity)}>{anchor}</Magnetic>
                    ) : (
                      anchor
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {theme.canvasMode !== "off" && <CanvasLayer elements={canvasElements} heightPx={theme.canvasHeightPx} />}
    </div>
  );
}
