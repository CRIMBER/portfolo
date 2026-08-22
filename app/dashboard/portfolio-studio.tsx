"use client";

import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import type { AnimationIntensity, AnimationTarget, CanvasMode, ThemeConfig } from "@/lib/theme/schema";
import { startingPresets } from "@/lib/theme/presets";
import { parseColor, toRgba } from "@/lib/theme/color";
import { PRESET_OPTIONS, TARGET_LABELS, EDITABLE_TARGETS, FONT_OPTIONS, FONT_WEIGHT_OPTIONS } from "@/lib/theme/preset-registry";
import type { CanvasAnimationTrigger, CanvasElementData, MarqueeWidgetData, StatusWidgetData, WidgetKind, WidgetPayload } from "@/lib/canvas/schema";
import { decodeWidget, defaultImageStyle, defaultTextStyle, defaultWidgetData, encodeWidget, WIDGET_KINDS, WIDGET_LABELS } from "@/lib/canvas/schema";
import { ENTRANCE_PRESET_IDS, HOVER_PRESET_IDS, SCROLL_PRESET_IDS } from "@/lib/canvas/animation-registry";
import { CanvasWidget } from "@/components/canvas/CanvasWidget";
import { INTRO_PRESET_IDS, INTRO_PRESET_LABELS, QR_INTRO_PRESET_IDS, QR_INTRO_PRESET_LABELS } from "@/lib/intro/registry";
import { IntroOverlay } from "@/components/intro/IntroOverlay";
import { PortfolioRenderer, type PortfolioProject, type PortfolioSocialLink } from "@/components/portfolio/PortfolioRenderer";
import { saveThemeConfig, saveCanvasElements, uploadBackgroundImage, uploadCanvasImage } from "./actions";
import { saveProfile, saveProjects, saveSocialLinks } from "./content-actions";
import { splitList, type EditableProfile, type EditableProject, type EditableSocialLink } from "./content-types";
import { ProfilePanel } from "./ProfilePanel";
import { ProjectsPanel } from "./ProjectsPanel";
import { SocialLinksPanel } from "./SocialLinksPanel";
import themeStyles from "./theme-studio.module.css";
import canvasStyles from "./canvas-studio.module.css";

type ColorKey = "primary" | "secondary" | "accent" | "background" | "text" | "textMuted";

interface PortfolioStudioProps {
  initialTheme: ThemeConfig;
  initialCanvasElements: CanvasElementData[];
  handle: string;
  initialDisplayName: string | null;
  initialTagline: string | null;
  initialBio: string | null;
  initialAboutLong: string | null;
  initialProjects: PortfolioProject[];
  initialSocialLinks: PortfolioSocialLink[];
}

function toEditableProject(p: PortfolioProject): EditableProject {
  return {
    id: p.id,
    title: p.title,
    description: p.description ?? "",
    role: p.role ?? "",
    technologiesText: p.technologies.join(", "),
    collaboratorsText: (p.collaborators ?? []).join(", "),
    githubUrl: p.githubUrl ?? "",
    demoUrl: p.demoUrl ?? "",
    researchUrl: p.researchUrl ?? "",
    media: p.media ?? [],
  };
}

function toRenderProject(p: EditableProject): PortfolioProject {
  return {
    id: p.id,
    title: p.title,
    description: p.description || null,
    role: p.role || null,
    technologies: splitList(p.technologiesText),
    collaborators: splitList(p.collaboratorsText),
    githubUrl: p.githubUrl || null,
    demoUrl: p.demoUrl || null,
    researchUrl: p.researchUrl || null,
    media: p.media,
  };
}

function toEditableSocialLink(l: PortfolioSocialLink): EditableSocialLink {
  return { id: l.id, platform: l.platform as EditableSocialLink["platform"], url: l.url };
}

const TRIGGER_LABELS: Record<CanvasAnimationTrigger, string> = {
  entrance: "Entrance (on load)",
  hover: "Hover",
  scroll: "Scroll into view",
};

const TRIGGER_PRESETS: Record<CanvasAnimationTrigger, string[]> = {
  entrance: ENTRANCE_PRESET_IDS,
  scroll: SCROLL_PRESET_IDS,
  hover: HOVER_PRESET_IDS,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function newId(): string {
  return `local-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

// One ThemeConfig, one canvas element list, one live preview, one
// Save — everything the member edits (theme panels below, canvas
// builder further down) writes into this single component's state,
// so the preview at the bottom always reflects *every* unsaved edit
// at once, and Save persists the exact thing being previewed. This
// replaced two separate studios with two separate previews that could
// disagree with each other (the canvas one was tracking last-*saved*
// theme, not live edits).
export function PortfolioStudio({
  initialTheme,
  initialCanvasElements,
  handle,
  initialDisplayName,
  initialTagline,
  initialBio,
  initialAboutLong,
  initialProjects,
  initialSocialLinks,
}: PortfolioStudioProps) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme);
  const [elements, setElements] = useState<CanvasElementData[]>(initialCanvasElements);
  const [profile, setProfile] = useState<EditableProfile>({
    displayName: initialDisplayName ?? "",
    tagline: initialTagline ?? "",
    bio: initialBio ?? "",
    aboutLong: initialAboutLong ?? "",
  });
  const [projects, setProjects] = useState<EditableProject[]>(initialProjects.map(toEditableProject));
  const [socialLinks, setSocialLinks] = useState<EditableSocialLink[]>(initialSocialLinks.map(toEditableSocialLink));
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [previewingIntro, setPreviewingIntro] = useState(false);
  const [previewingQrIntro, setPreviewingQrIntro] = useState(false);
  const [widgetKindToAdd, setWidgetKindToAdd] = useState<WidgetKind>("stat");
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "saved" | "error"; message?: string }>({
    kind: "idle",
  });
  const [dirty, setDirty] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const surface = parseColor(theme.colors.surface);
  const selected = elements.find((el) => el.id === selectedId) ?? null;

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function touch() {
    setActivePreset(null);
    setStatus({ kind: "idle" });
    setDirty(true);
  }

  // ---- theme panel handlers ----

  function updateColor(key: ColorKey, value: string) {
    touch();
    setTheme((t) => ({
      ...t,
      colors: { ...t.colors, [key]: value },
      background: key === "background" && t.background.kind === "solid" ? { ...t.background, value } : t.background,
    }));
  }

  function updateSurfaceHex(hex: string) {
    touch();
    setTheme((t) => ({ ...t, colors: { ...t.colors, surface: toRgba(hex, parseColor(t.colors.surface).alpha) } }));
  }

  function updateSurfaceOpacity(pct: number) {
    touch();
    setTheme((t) => ({ ...t, colors: { ...t.colors, surface: toRgba(parseColor(t.colors.surface).hex, pct / 100) } }));
  }

  function updateAlign(heroAlign: ThemeConfig["layout"]["heroAlign"]) {
    touch();
    setTheme((t) => ({ ...t, layout: { heroAlign } }));
  }

  function updateFont(key: "headingFont" | "bodyFont", value: string) {
    touch();
    setTheme((t) => ({ ...t, typography: { ...t.typography, [key]: value } }));
  }

  function updateWeight(key: "heading" | "body", value: number) {
    touch();
    setTheme((t) => ({ ...t, typography: { ...t.typography, weight: { ...t.typography.weight, [key]: value } } }));
  }

  function updateTypeScale(key: "baseSizePx" | "scaleRatio", value: number) {
    touch();
    setTheme((t) => ({ ...t, typography: { ...t.typography, [key]: value } }));
  }

  function updateIntroPreset(presetId: string | null) {
    touch();
    setTheme((t) => ({ ...t, intro: { ...t.intro, presetId } }));
  }

  function updateIntroDuration(durationMs: number) {
    touch();
    setTheme((t) => ({ ...t, intro: { ...t.intro, durationMs } }));
  }

  function updateQrIntroPreset(presetId: string | null) {
    touch();
    setTheme((t) => ({ ...t, qrIntro: { ...t.qrIntro, presetId } }));
  }

  function updateQrIntroDuration(durationMs: number) {
    touch();
    setTheme((t) => ({ ...t, qrIntro: { ...t.qrIntro, durationMs } }));
  }

  function updateReel(patch: Partial<ThemeConfig["reel"]>) {
    touch();
    setTheme((t) => ({ ...t, reel: { ...t.reel, ...patch } }));
  }

  function updateAnimation(target: AnimationTarget, presetId: string | null, intensity: AnimationIntensity) {
    touch();
    setTheme((t) => {
      const others = t.animation.presets.filter((p) => p.target !== target);
      return {
        ...t,
        animation: { ...t.animation, presets: presetId ? [...others, { target, presetId, intensity }] : others },
      };
    });
  }

  function useSolidBackground() {
    touch();
    setTheme((t) => ({ ...t, background: { kind: "solid", value: t.colors.background } }));
  }

  function useGradientBackground() {
    touch();
    setTheme((t) => ({
      ...t,
      background: { kind: "gradient", value: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.secondary})` },
    }));
  }

  async function handleBackgroundFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadBackgroundImage(formData);
    setUploading(false);
    event.target.value = "";

    if (result.error || !result.url) {
      setStatus({ kind: "error", message: result.error ?? "Upload failed." });
      return;
    }
    touch();
    setTheme((t) => ({ ...t, background: { kind: "image", value: result.url! } }));
  }

  // ---- canvas builder handlers ----

  function updateCanvasMode(mode: CanvasMode) {
    touch();
    setTheme((t) => ({ ...t, canvasMode: mode }));
  }

  function updateCanvasHeight(heightPx: number) {
    touch();
    setTheme((t) => ({ ...t, canvasHeightPx: heightPx }));
  }

  function updateElement(id: string, patch: Partial<CanvasElementData>) {
    touch();
    setElements((els) => els.map((el) => (el.id === id ? { ...el, ...patch } : el)));
  }

  function addText() {
    touch();
    const id = newId();
    const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0);
    setElements((els) => [
      ...els,
      {
        id,
        type: "text",
        content: "New text",
        xPct: 8,
        yPx: 8,
        widthPct: 35,
        heightPx: 60,
        rotationDeg: 0,
        zIndex: maxZ + 1,
        textStyle: defaultTextStyle(),
        imageStyle: defaultImageStyle(),
        animations: [],
      },
    ]);
    setSelectedId(id);
  }

  async function addImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    touch();
    setUploadingId("__new__");
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadCanvasImage(formData);
    setUploadingId(null);
    if (result.error || !result.url) {
      setStatus({ kind: "error", message: result.error ?? "Upload failed." });
      return;
    }

    const id = newId();
    const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0);
    setElements((els) => [
      ...els,
      {
        id,
        type: "image",
        content: result.url!,
        xPct: 8,
        yPx: 8,
        widthPct: 35,
        heightPx: 200,
        rotationDeg: 0,
        zIndex: maxZ + 1,
        textStyle: defaultTextStyle(),
        imageStyle: defaultImageStyle(),
        animations: [],
      },
    ]);
    setSelectedId(id);
  }

  function addWidget(kind: WidgetKind) {
    touch();
    const id = newId();
    const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0);
    setElements((els) => [
      ...els,
      {
        id,
        type: "widget",
        content: encodeWidget(defaultWidgetData(kind)),
        xPct: 8,
        yPx: 8,
        widthPct: 30,
        heightPx: 120,
        rotationDeg: 0,
        zIndex: maxZ + 1,
        textStyle: defaultTextStyle(),
        imageStyle: defaultImageStyle(),
        animations: [],
      },
    ]);
    setSelectedId(id);
  }

  async function replaceImage(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    touch();
    setUploadingId(id);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadCanvasImage(formData);
    setUploadingId(null);
    if (result.error || !result.url) {
      setStatus({ kind: "error", message: result.error ?? "Upload failed." });
      return;
    }
    updateElement(id, { content: result.url });
  }

  function deleteElement(id: string) {
    if (!window.confirm("Delete this element? This can't be undone once you save.")) return;
    touch();
    setElements((els) => els.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function bringToFront(id: string) {
    const maxZ = elements.reduce((m, el) => Math.max(m, el.zIndex), 0);
    updateElement(id, { zIndex: maxZ + 1 });
  }

  function sendToBack(id: string) {
    const minZ = elements.reduce((m, el) => Math.min(m, el.zIndex), 0);
    updateElement(id, { zIndex: minZ - 1 });
  }

  function updateElementAnimation(id: string, trigger: CanvasAnimationTrigger, presetId: string | null, intensity: AnimationIntensity) {
    touch();
    setElements((els) =>
      els.map((el) => {
        if (el.id !== id) return el;
        const others = el.animations.filter((a) => a.trigger !== trigger);
        return { ...el, animations: presetId ? [...others, { trigger, presetId, intensity }] : others };
      }),
    );
  }

  // ---- save ----

  async function handleSave() {
    setStatus({ kind: "saving" });
    const projectPayload = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      role: p.role,
      technologies: splitList(p.technologiesText),
      collaborators: splitList(p.collaboratorsText),
      githubUrl: p.githubUrl,
      demoUrl: p.demoUrl,
      researchUrl: p.researchUrl,
      media: p.media,
    }));
    const [themeResult, canvasResult, profileResult, projectsResult, socialLinksResult] = await Promise.all([
      saveThemeConfig(theme),
      saveCanvasElements(elements),
      saveProfile(profile),
      saveProjects(projectPayload),
      saveSocialLinks(socialLinks),
    ]);

    if (canvasResult.data) setElements(canvasResult.data);
    if (projectsResult.data) setProjects(projectsResult.data.map(toEditableProject));
    if (socialLinksResult.data) setSocialLinks(socialLinksResult.data.map(toEditableSocialLink));

    // Every mutation runs regardless of the others' outcome (they're
    // independent server actions in one Promise.all), so collect every
    // failure rather than stopping at the first — otherwise a member
    // fixing a projects error, saving again, would never learn their
    // social links also failed validation.
    const errors = [themeResult.error, canvasResult.error, profileResult.error, projectsResult.error, socialLinksResult.error].filter(
      (e): e is string => Boolean(e),
    );
    if (errors.length > 0) {
      setStatus({ kind: "error", message: errors.join(" ") });
      return;
    }
    setDirty(false);
    setStatus({ kind: "saved" });
  }

  return (
    <div className={themeStyles.studio}>
      <ProfilePanel value={profile} onChange={(patch) => { touch(); setProfile((p) => ({ ...p, ...patch })); }} />
      <ProjectsPanel projects={projects} onChange={(next) => { touch(); setProjects(next); }} />
      <SocialLinksPanel links={socialLinks} onChange={(next) => { touch(); setSocialLinks(next); }} />

      <section className="panel">
        <div className={themeStyles.panelHeader}>
          <h3>Starting point</h3>
          <p>Pick one to seed everything below — then tweak freely.</p>
        </div>
        <div className={themeStyles.presetGrid}>
          {Object.entries(startingPresets).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              className="btn-secondary"
              data-active={activePreset === key}
              onClick={() => {
                setStatus({ kind: "idle" });
                setActivePreset(key);
                setTheme(preset);
              }}
            >
              <span className={themeStyles.presetChip}>
                {key}
                <span className={themeStyles.swatches}>
                  <span className={themeStyles.swatchDot} style={{ background: preset.colors.primary }} />
                  <span className={themeStyles.swatchDot} style={{ background: preset.colors.secondary }} />
                  <span className={themeStyles.swatchDot} style={{ background: preset.colors.accent }} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className={themeStyles.panelHeader}>
          <h3>Colors &amp; transparency</h3>
          <p>Edited in place, on top of whichever theme is active.</p>
        </div>
        <div className={themeStyles.colorGrid}>
          <ColorField label="Primary" value={theme.colors.primary} onChange={(v) => updateColor("primary", v)} />
          <ColorField label="Secondary" value={theme.colors.secondary} onChange={(v) => updateColor("secondary", v)} />
          <ColorField label="Accent" value={theme.colors.accent} onChange={(v) => updateColor("accent", v)} />
          <ColorField
            label="Page background"
            value={theme.colors.background}
            onChange={(v) => updateColor("background", v)}
          />
          <ColorField label="Text" value={theme.colors.text} onChange={(v) => updateColor("text", v)} />
          <ColorField label="Muted text" value={theme.colors.textMuted} onChange={(v) => updateColor("textMuted", v)} />
          <ColorField label="Card surface" value={surface.hex} onChange={updateSurfaceHex} />
        </div>

        <div className={themeStyles.controlsRow}>
          <label className={themeStyles.controlField}>
            Card transparency
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(surface.alpha * 100)}
              onChange={(e) => updateSurfaceOpacity(Number(e.target.value))}
            />
            <span className={themeStyles.hint}>Below 100% turns on real frosted-glass blur automatically.</span>
          </label>

          <label className={themeStyles.controlField}>
            Name alignment
            <select
              value={theme.layout.heroAlign}
              onChange={(e) => updateAlign(e.target.value as ThemeConfig["layout"]["heroAlign"])}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className={themeStyles.panelHeader}>
          <h3>Typography</h3>
          <p>Fonts load live from Google Fonts as you pick them — same as the public page.</p>
        </div>
        <div className={themeStyles.colorGrid}>
          <label className={themeStyles.controlField}>
            Heading font
            <select value={theme.typography.headingFont} onChange={(e) => updateFont("headingFont", e.target.value)}>
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </label>
          <label className={themeStyles.controlField}>
            Body font
            <select value={theme.typography.bodyFont} onChange={(e) => updateFont("bodyFont", e.target.value)}>
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </label>
          <label className={themeStyles.controlField}>
            Heading weight
            <select
              value={theme.typography.weight.heading}
              onChange={(e) => updateWeight("heading", Number(e.target.value))}
            >
              {FONT_WEIGHT_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
          <label className={themeStyles.controlField}>
            Body weight
            <select value={theme.typography.weight.body} onChange={(e) => updateWeight("body", Number(e.target.value))}>
              {FONT_WEIGHT_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={themeStyles.controlsRow}>
          <label className={themeStyles.controlField}>
            Base size ({theme.typography.baseSizePx}px)
            <input
              type="range"
              min={13}
              max={22}
              value={theme.typography.baseSizePx}
              onChange={(e) => updateTypeScale("baseSizePx", Number(e.target.value))}
            />
          </label>
          <label className={themeStyles.controlField}>
            Type scale ({theme.typography.scaleRatio.toFixed(2)})
            <input
              type="range"
              min={1.1}
              max={1.5}
              step={0.01}
              value={theme.typography.scaleRatio}
              onChange={(e) => updateTypeScale("scaleRatio", Number(e.target.value))}
            />
            <span className={themeStyles.hint}>How much bigger each heading level gets.</span>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className={themeStyles.panelHeader}>
          <h3>Background</h3>
        </div>
        <div className={themeStyles.backgroundRow}>
          <button type="button" className="btn-secondary" data-active={theme.background.kind === "solid"} onClick={useSolidBackground}>
            Solid color
          </button>
          <button
            type="button"
            className="btn-secondary"
            data-active={theme.background.kind === "gradient"}
            onClick={useGradientBackground}
          >
            Gradient (primary → secondary)
          </button>
          <label className={themeStyles.fileLabel}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleBackgroundFileChange}
              disabled={uploading}
            />
          </label>
          {uploading && <span className="badge">Uploading…</span>}
        </div>
        <p className={themeStyles.hint}>
          Current: {theme.background.kind}
          {theme.background.kind === "image" ? ` (${theme.background.value})` : ""}
        </p>
      </section>

      <section className="panel">
        <div className={themeStyles.panelHeader}>
          <h3>Animations</h3>
          <p>Pick any preset for any target — nothing here is tied to a specific starting theme.</p>
        </div>
        <div className={themeStyles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Target</th>
                <th>Preset</th>
                <th>Intensity</th>
              </tr>
            </thead>
            <tbody>
              {EDITABLE_TARGETS.map((target) => {
                const current = theme.animation.presets.find((p) => p.target === target);
                const options = PRESET_OPTIONS[target] ?? [];
                return (
                  <tr key={target} className={current ? themeStyles.activeRow : undefined}>
                    <td>{TARGET_LABELS[target]}</td>
                    <td>
                      <select
                        className={themeStyles.presetSelect}
                        value={current?.presetId ?? ""}
                        onChange={(e) => updateAnimation(target, e.target.value || null, current?.intensity ?? "smooth")}
                      >
                        <option value="">None</option>
                        {options.map((id) => (
                          <option key={id} value={id}>
                            {id}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className={themeStyles.intensitySelect}
                        value={current?.intensity ?? "smooth"}
                        disabled={!current}
                        onChange={(e) => current && updateAnimation(target, current.presetId, e.target.value as AnimationIntensity)}
                      >
                        <option value="calm">Calm</option>
                        <option value="smooth">Smooth</option>
                        <option value="dynamic">Dynamic</option>
                        <option value="extreme">Extreme</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className={themeStyles.panelHeader}>
          <h3>Intro cutscene</h3>
          <p>A one-time, full-screen sequence that plays before the page reveals itself — once per visitor per browser session.</p>
        </div>
        <div className={themeStyles.controlsRow}>
          <label className={themeStyles.controlField}>
            Cutscene
            <select value={theme.intro.presetId ?? ""} onChange={(e) => updateIntroPreset(e.target.value || null)}>
              <option value="">None</option>
              {INTRO_PRESET_IDS.map((id) => (
                <option key={id} value={id}>
                  {INTRO_PRESET_LABELS[id]}
                </option>
              ))}
            </select>
          </label>
          <label className={themeStyles.controlField}>
            Duration ({(theme.intro.durationMs / 1000).toFixed(1)}s)
            <input
              type="range"
              min={800}
              max={6000}
              step={100}
              value={theme.intro.durationMs}
              onChange={(e) => updateIntroDuration(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            className="btn-secondary"
            disabled={!theme.intro.presetId || previewingIntro}
            onClick={() => setPreviewingIntro(true)}
          >
            {previewingIntro ? "Playing…" : "▶ Preview"}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className={themeStyles.panelHeader}>
          <h3>QR scan intro</h3>
          <p>A different cutscene shown only when a visitor arrives by scanning your QR code. Leave as None to use the regular intro above for QR scans too.</p>
        </div>
        <div className={themeStyles.controlsRow}>
          <label className={themeStyles.controlField}>
            Cutscene
            <select value={theme.qrIntro.presetId ?? ""} onChange={(e) => updateQrIntroPreset(e.target.value || null)}>
              <option value="">None</option>
              {QR_INTRO_PRESET_IDS.map((id) => (
                <option key={id} value={id}>
                  {QR_INTRO_PRESET_LABELS[id]}
                </option>
              ))}
            </select>
          </label>
          <label className={themeStyles.controlField}>
            Duration ({(theme.qrIntro.durationMs / 1000).toFixed(1)}s)
            <input
              type="range"
              min={800}
              max={6000}
              step={100}
              value={theme.qrIntro.durationMs}
              onChange={(e) => updateQrIntroDuration(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            className="btn-secondary"
            disabled={!theme.qrIntro.presetId || previewingQrIntro}
            onClick={() => setPreviewingQrIntro(true)}
          >
            {previewingQrIntro ? "Playing…" : "▶ Preview"}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className={themeStyles.panelHeader}>
          <h3>Showcase reel</h3>
          <p>A &ldquo;▶ Watch reel&rdquo; button visitors can click to step through your projects full-screen. Needs 2+ projects.</p>
        </div>
        <div className={themeStyles.controlsRow}>
          <label className={themeStyles.controlField}>
            <input type="checkbox" checked={theme.reel.enabled} onChange={(e) => updateReel({ enabled: e.target.checked })} /> Enabled
          </label>
          <label className={themeStyles.controlField}>
            Transition
            <select value={theme.reel.transitionPresetId} onChange={(e) => updateReel({ transitionPresetId: e.target.value })}>
              {ENTRANCE_PRESET_IDS.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label className={themeStyles.controlField}>
            Auto-advance ({theme.reel.autoAdvanceMs === 0 ? "off" : `${(theme.reel.autoAdvanceMs / 1000).toFixed(1)}s`})
            <input
              type="range"
              min={0}
              max={10000}
              step={500}
              value={theme.reel.autoAdvanceMs}
              onChange={(e) => updateReel({ autoAdvanceMs: Number(e.target.value) })}
            />
          </label>
        </div>
      </section>

      {previewingIntro && theme.intro.presetId && (
        <IntroOverlay
          presetId={theme.intro.presetId}
          durationMs={theme.intro.durationMs}
          handle={handle}
          displayName={profile.displayName || null}
          tagline={profile.tagline || null}
          textColor={theme.colors.text}
          accentColor={theme.colors.primary}
          backgroundColor={theme.colors.background}
          fontFamily={`"${theme.typography.headingFont}", system-ui, sans-serif`}
          bypassGate
          onDone={() => setPreviewingIntro(false)}
        />
      )}

      {previewingQrIntro && theme.qrIntro.presetId && (
        <IntroOverlay
          presetId={theme.qrIntro.presetId}
          durationMs={theme.qrIntro.durationMs}
          handle={handle}
          displayName={profile.displayName || null}
          tagline={profile.tagline || null}
          textColor={theme.colors.text}
          accentColor={theme.colors.primary}
          backgroundColor={theme.colors.background}
          fontFamily={`"${theme.typography.headingFont}", system-ui, sans-serif`}
          bypassGate
          onDone={() => setPreviewingQrIntro(false)}
        />
      )}

      <section className="panel">
        <div className={canvasStyles.panelHeader}>
          <h3>Canvas builder</h3>
          <p>Freely place text and images, drag/resize/rotate them, and animate each one independently.</p>
        </div>

        <div className={canvasStyles.topRow}>
          <label className={canvasStyles.controlField}>
            Mode
            <select value={theme.canvasMode} onChange={(e) => updateCanvasMode(e.target.value as CanvasMode)}>
              <option value="off">Off — canvas not shown</option>
              <option value="layer">Layer — appended below your existing page</option>
              <option value="replace">Replace — canvas is the entire page</option>
            </select>
          </label>
          <label className={canvasStyles.controlField}>
            Canvas height ({theme.canvasHeightPx}px)
            <input
              type="range"
              min={300}
              max={3000}
              step={20}
              value={theme.canvasHeightPx}
              onChange={(e) => updateCanvasHeight(Number(e.target.value))}
            />
          </label>
          <div className={canvasStyles.addRow}>
            <button type="button" className="btn-secondary" onClick={addText}>
              Add text
            </button>
            <label className="btn-secondary" style={{ cursor: "pointer" }}>
              {uploadingId === "__new__" ? "Uploading…" : "Add image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={addImage}
                disabled={uploadingId === "__new__"}
                style={{ display: "none" }}
              />
            </label>
            <select value={widgetKindToAdd} onChange={(e) => setWidgetKindToAdd(e.target.value as WidgetKind)}>
              {WIDGET_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {WIDGET_LABELS[kind]}
                </option>
              ))}
            </select>
            <button type="button" className="btn-secondary" onClick={() => addWidget(widgetKindToAdd)}>
              + Add widget
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className={canvasStyles.panelHeader}>
          <h3>Layout</h3>
          <p>Drag to move, corner handle to resize, top handle to rotate. Click an element to edit it below.</p>
        </div>
        <div className={canvasStyles.canvasShell}>
          <div
            ref={canvasRef}
            className={canvasStyles.canvasSurface}
            style={{ height: theme.canvasHeightPx }}
            onPointerDown={() => setSelectedId(null)}
          >
            {elements.map((element) => (
              <EditableElement
                key={element.id}
                element={element}
                selected={selectedId === element.id}
                onSelect={() => setSelectedId(element.id)}
                onChange={(patch) => updateElement(element.id, patch)}
                onDelete={() => deleteElement(element.id)}
                canvasRef={canvasRef}
              />
            ))}
            {elements.length === 0 && <p className={canvasStyles.emptyState}>Nothing here yet — add text, an image, or a widget above.</p>}
          </div>
        </div>
      </section>

      {selected && (
        <section className="panel">
          <div className={canvasStyles.panelHeader}>
            <h3>{selected.type === "text" ? "Text element" : selected.type === "widget" ? "Widget element" : "Image element"}</h3>
          </div>
          <div className={canvasStyles.inspector}>
            {selected.type === "text" ? (
              <>
                <label className={canvasStyles.controlField} style={{ minWidth: "100%" }}>
                  Content
                  <textarea
                    rows={2}
                    value={selected.content}
                    onChange={(e) => updateElement(selected.id, { content: e.target.value })}
                  />
                </label>
                <div className={canvasStyles.inspectorGrid}>
                  <label className={canvasStyles.controlField}>
                    Font
                    <select
                      value={selected.textStyle.fontFamily}
                      onChange={(e) => updateElement(selected.id, { textStyle: { ...selected.textStyle, fontFamily: e.target.value } })}
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={canvasStyles.controlField}>
                    Weight
                    <select
                      value={selected.textStyle.fontWeight}
                      onChange={(e) =>
                        updateElement(selected.id, { textStyle: { ...selected.textStyle, fontWeight: Number(e.target.value) } })
                      }
                    >
                      {FONT_WEIGHT_OPTIONS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={canvasStyles.controlField}>
                    Size ({selected.textStyle.fontSizePx}px)
                    <input
                      type="range"
                      min={10}
                      max={120}
                      value={selected.textStyle.fontSizePx}
                      onChange={(e) =>
                        updateElement(selected.id, { textStyle: { ...selected.textStyle, fontSizePx: Number(e.target.value) } })
                      }
                    />
                  </label>
                  <label className={canvasStyles.controlField}>
                    Color
                    <input
                      type="color"
                      value={selected.textStyle.color}
                      onChange={(e) => updateElement(selected.id, { textStyle: { ...selected.textStyle, color: e.target.value } })}
                    />
                  </label>
                  <label className={canvasStyles.controlField}>
                    Align
                    <select
                      value={selected.textStyle.textAlign}
                      onChange={(e) =>
                        updateElement(selected.id, {
                          textStyle: { ...selected.textStyle, textAlign: e.target.value as "left" | "center" | "right" },
                        })
                      }
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                </div>
              </>
            ) : selected.type === "widget" ? (
              <WidgetInspector element={selected} onUpdateContent={(content) => updateElement(selected.id, { content })} />
            ) : (
              <div className={canvasStyles.inspectorGrid}>
                <label className="btn-secondary" style={{ cursor: "pointer", textAlign: "center" }}>
                  {uploadingId === selected.id ? "Uploading…" : "Replace image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => replaceImage(selected.id, e)}
                    disabled={uploadingId === selected.id}
                    style={{ display: "none" }}
                  />
                </label>
                <label className={canvasStyles.controlField}>
                  Fit
                  <select
                    value={selected.imageStyle.objectFit}
                    onChange={(e) =>
                      updateElement(selected.id, { imageStyle: { ...selected.imageStyle, objectFit: e.target.value as "cover" | "contain" } })
                    }
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                  </select>
                </label>
                <label className={canvasStyles.controlField}>
                  Corner radius ({selected.imageStyle.borderRadiusPx}px)
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={selected.imageStyle.borderRadiusPx}
                    onChange={(e) =>
                      updateElement(selected.id, { imageStyle: { ...selected.imageStyle, borderRadiusPx: Number(e.target.value) } })
                    }
                  />
                </label>
                <label className={canvasStyles.controlField}>
                  Opacity ({Math.round(selected.imageStyle.opacity * 100)}%)
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(selected.imageStyle.opacity * 100)}
                    onChange={(e) => updateElement(selected.id, { imageStyle: { ...selected.imageStyle, opacity: Number(e.target.value) / 100 } })}
                  />
                </label>
              </div>
            )}

            <div className={canvasStyles.inspectorRow}>
              <label className={canvasStyles.controlField}>
                X ({selected.xPct.toFixed(0)}%)
                <input
                  type="number"
                  value={Math.round(selected.xPct)}
                  onChange={(e) => updateElement(selected.id, { xPct: clamp(Number(e.target.value), -20, 100) })}
                />
              </label>
              <label className={canvasStyles.controlField}>
                Y ({selected.yPx.toFixed(0)}px)
                <input type="number" value={Math.round(selected.yPx)} onChange={(e) => updateElement(selected.id, { yPx: Number(e.target.value) })} />
              </label>
              <label className={canvasStyles.controlField}>
                Width ({selected.widthPct.toFixed(0)}%)
                <input
                  type="number"
                  value={Math.round(selected.widthPct)}
                  onChange={(e) => updateElement(selected.id, { widthPct: clamp(Number(e.target.value), 2, 100) })}
                />
              </label>
              <label className={canvasStyles.controlField}>
                Height ({selected.heightPx.toFixed(0)}px)
                <input
                  type="number"
                  value={Math.round(selected.heightPx)}
                  onChange={(e) => updateElement(selected.id, { heightPx: clamp(Number(e.target.value), 10, 4000) })}
                />
              </label>
              <label className={canvasStyles.controlField}>
                Rotation ({selected.rotationDeg.toFixed(0)}°)
                <input
                  type="number"
                  value={Math.round(selected.rotationDeg)}
                  onChange={(e) => updateElement(selected.id, { rotationDeg: clamp(Number(e.target.value), -180, 180) })}
                />
              </label>
              <label className={canvasStyles.controlField}>
                Layering
                <span className={canvasStyles.zButtons}>
                  <button type="button" className="btn-secondary" onClick={() => sendToBack(selected.id)}>
                    Send back
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => bringToFront(selected.id)}>
                    Bring front
                  </button>
                </span>
              </label>
            </div>

            <div className={canvasStyles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Trigger</th>
                    <th>Preset</th>
                    <th>Intensity</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(TRIGGER_LABELS) as CanvasAnimationTrigger[]).map((trigger) => {
                    const current = selected.animations.find((a) => a.trigger === trigger);
                    return (
                      <tr key={trigger}>
                        <td>{TRIGGER_LABELS[trigger]}</td>
                        <td>
                          <select
                            className={canvasStyles.presetSelect}
                            value={current?.presetId ?? ""}
                            onChange={(e) => updateElementAnimation(selected.id, trigger, e.target.value || null, current?.intensity ?? "smooth")}
                          >
                            <option value="">None</option>
                            {TRIGGER_PRESETS[trigger].map((id) => (
                              <option key={id} value={id}>
                                {id}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className={canvasStyles.intensitySelect}
                            value={current?.intensity ?? "smooth"}
                            disabled={!current}
                            onChange={(e) => current && updateElementAnimation(selected.id, trigger, current.presetId, e.target.value as AnimationIntensity)}
                          >
                            <option value="calm">Calm</option>
                            <option value="smooth">Smooth</option>
                            <option value="dynamic">Dynamic</option>
                            <option value="extreme">Extreme</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button type="button" className="btn-secondary" data-tone="danger" onClick={() => deleteElement(selected.id)}>
              Delete element
            </button>
          </div>
        </section>
      )}

      <section className="panel">
        <div className={themeStyles.panelHeader}>
          <h3>Live preview</h3>
          <p>Same renderer as the public page — updates instantly as you edit anything above, theme or canvas.</p>
        </div>
        <div className={themeStyles.previewFrame}>
          <PortfolioRenderer
            theme={theme}
            handle={handle}
            displayName={profile.displayName || null}
            tagline={profile.tagline || null}
            bio={profile.bio || null}
            aboutLong={profile.aboutLong || null}
            projects={projects.map(toRenderProject)}
            socialLinks={socialLinks}
            canvasElements={elements}
            fullHeight={false}
          />
        </div>
      </section>

      <div className={themeStyles.saveBar}>
        <button type="button" onClick={handleSave} disabled={status.kind === "saving"}>
          {status.kind === "saving" ? "Saving…" : "Save"}
        </button>
        {status.kind === "saved" && (
          <span className="badge" data-tone="success">
            Saved
          </span>
        )}
        {status.kind === "error" && (
          <span className="badge" data-tone="danger">
            {status.message}
          </span>
        )}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className={themeStyles.colorField}>
      {label}
      <span className={themeStyles.colorRow}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <span className={themeStyles.hexValue}>{value.toUpperCase()}</span>
      </span>
    </label>
  );
}

function WidgetInspector({
  element,
  onUpdateContent,
}: {
  element: CanvasElementData;
  onUpdateContent: (content: string) => void;
}) {
  const payload = decodeWidget(element.content) ?? defaultWidgetData("stat");

  function setKind(kind: WidgetKind) {
    onUpdateContent(encodeWidget(defaultWidgetData(kind)));
  }

  function patch(next: WidgetPayload) {
    onUpdateContent(encodeWidget(next));
  }

  return (
    <div className={canvasStyles.inspectorGrid}>
      <label className={canvasStyles.controlField}>
        Widget type
        <select value={payload.kind} onChange={(e) => setKind(e.target.value as WidgetKind)}>
          {WIDGET_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {WIDGET_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>

      {payload.kind === "stat" && (
        <>
          <label className={canvasStyles.controlField}>
            Label
            <input
              type="text"
              value={payload.data.label}
              maxLength={60}
              onChange={(e) => patch({ ...payload, data: { ...payload.data, label: e.target.value } })}
            />
          </label>
          <label className={canvasStyles.controlField}>
            Value
            <input
              type="number"
              value={payload.data.value}
              onChange={(e) => patch({ ...payload, data: { ...payload.data, value: Number(e.target.value) } })}
            />
          </label>
          <label className={canvasStyles.controlField}>
            Suffix
            <input
              type="text"
              value={payload.data.suffix}
              maxLength={10}
              placeholder="+, %, k…"
              onChange={(e) => patch({ ...payload, data: { ...payload.data, suffix: e.target.value } })}
            />
          </label>
        </>
      )}

      {payload.kind === "status" && (
        <>
          <label className={canvasStyles.controlField}>
            Label
            <input
              type="text"
              value={payload.data.label}
              maxLength={60}
              onChange={(e) => patch({ ...payload, data: { ...payload.data, label: e.target.value } })}
            />
          </label>
          <label className={canvasStyles.controlField}>
            State
            <select
              value={payload.data.state}
              onChange={(e) => patch({ ...payload, data: { ...payload.data, state: e.target.value as StatusWidgetData["state"] } })}
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="away">Away</option>
            </select>
          </label>
        </>
      )}

      {payload.kind === "marquee" && (
        <>
          <label className={canvasStyles.controlField} style={{ minWidth: "100%" }}>
            Text
            <input
              type="text"
              value={payload.data.text}
              maxLength={300}
              onChange={(e) => patch({ ...payload, data: { ...payload.data, text: e.target.value } })}
            />
          </label>
          <label className={canvasStyles.controlField}>
            Speed
            <select
              value={payload.data.speed}
              onChange={(e) => patch({ ...payload, data: { ...payload.data, speed: e.target.value as MarqueeWidgetData["speed"] } })}
            >
              <option value="slow">Slow</option>
              <option value="medium">Medium</option>
              <option value="fast">Fast</option>
            </select>
          </label>
        </>
      )}

      {payload.kind === "skillbars" && (
        <div style={{ minWidth: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          {payload.data.skills.map((skill, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={skill.label}
                style={{ flex: 1 }}
                onChange={(e) => {
                  const skills = payload.data.skills.map((s, si) => (si === i ? { ...s, label: e.target.value } : s));
                  patch({ ...payload, data: { skills } });
                }}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={skill.pct}
                style={{ width: 70 }}
                onChange={(e) => {
                  const pct = clamp(Number(e.target.value), 0, 100);
                  const skills = payload.data.skills.map((s, si) => (si === i ? { ...s, pct } : s));
                  patch({ ...payload, data: { skills } });
                }}
              />
              <button
                type="button"
                className="btn-secondary"
                disabled={payload.data.skills.length <= 1}
                onClick={() => patch({ ...payload, data: { skills: payload.data.skills.filter((_, si) => si !== i) } })}
                aria-label="Remove skill"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn-secondary"
            disabled={payload.data.skills.length >= 8}
            onClick={() => patch({ ...payload, data: { skills: [...payload.data.skills, { label: "New skill", pct: 50 }] } })}
          >
            + Add skill
          </button>
        </div>
      )}
    </div>
  );
}

function EditableElement({
  element,
  selected,
  onSelect,
  onChange,
  onDelete,
  canvasRef,
}: {
  element: CanvasElementData;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<CanvasElementData>) => void;
  onDelete: () => void;
  canvasRef: RefObject<HTMLDivElement | null>;
}) {
  const drag = useRef<{
    mode: "move" | "resize" | "rotate";
    startX: number;
    startY: number;
    orig: CanvasElementData;
  } | null>(null);

  function beginDrag(e: ReactPointerEvent<HTMLDivElement>, mode: "move" | "resize" | "rotate") {
    e.stopPropagation();
    onSelect();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { mode, startX: e.clientX, startY: e.clientY, orig: element };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const canvas = canvasRef.current;
    if (!d || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dxPx = e.clientX - d.startX;
    const dyPx = e.clientY - d.startY;

    if (d.mode === "move") {
      const dxPct = (dxPx / rect.width) * 100;
      onChange({ xPct: clamp(d.orig.xPct + dxPct, -20, 100), yPx: d.orig.yPx + dyPx });
    } else if (d.mode === "resize") {
      const dxPct = (dxPx / rect.width) * 100;
      onChange({
        widthPct: clamp(d.orig.widthPct + dxPct, 2, 100),
        heightPx: clamp(d.orig.heightPx + dyPx, 10, 4000),
      });
    } else if (d.mode === "rotate") {
      const centerX = rect.left + ((d.orig.xPct + d.orig.widthPct / 2) / 100) * rect.width;
      const centerY = rect.top + d.orig.yPx + d.orig.heightPx / 2;
      const angle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI + 90;
      const normalized = ((angle + 180) % 360 + 360) % 360 - 180;
      onChange({ rotationDeg: Math.round(normalized) });
    }
  }

  function endDrag() {
    drag.current = null;
  }

  return (
    <div
      className={`${canvasStyles.element} ${selected ? canvasStyles.elementSelected : ""}`}
      onPointerDown={(e) => beginDrag(e, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      style={{
        position: "absolute",
        left: `${element.xPct}%`,
        top: element.yPx,
        width: `${element.widthPct}%`,
        height: element.heightPx,
        transform: `rotate(${element.rotationDeg}deg)`,
        zIndex: element.zIndex,
      }}
    >
      <div
        className={canvasStyles.elementInner}
        style={
          element.type === "image"
            ? { borderRadius: element.imageStyle.borderRadiusPx, opacity: element.imageStyle.opacity }
            : {
                fontFamily: `"${element.textStyle.fontFamily}", system-ui, sans-serif`,
                fontSize: element.textStyle.fontSizePx,
                fontWeight: element.textStyle.fontWeight,
                color: element.textStyle.color,
                textAlign: element.textStyle.textAlign,
                justifyContent:
                  element.textStyle.textAlign === "center" ? "center" : element.textStyle.textAlign === "right" ? "flex-end" : "flex-start",
                whiteSpace: element.type === "text" ? "pre-wrap" : undefined,
              }
        }
      >
        {element.type === "text" ? (
          element.content
        ) : element.type === "widget" ? (
          (() => {
            const payload = decodeWidget(element.content);
            return (
              payload && (
                <CanvasWidget
                  payload={payload}
                  color={element.textStyle.color}
                  fontFamily={element.textStyle.fontFamily}
                  align={element.textStyle.textAlign}
                />
              )
            );
          })()
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- editor-only drag preview, not the public render path
          <img src={element.content} alt="" style={{ objectFit: element.imageStyle.objectFit }} />
        )}
      </div>
      {selected && (
        <>
          <button
            type="button"
            className={canvasStyles.deleteHandle}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onDelete}
            aria-label="Delete element"
          >
            ×
          </button>
          <div className={canvasStyles.resizeHandle} onPointerDown={(e) => beginDrag(e, "resize")} onPointerMove={onPointerMove} onPointerUp={endDrag} />
          <div className={canvasStyles.rotateHandle} onPointerDown={(e) => beginDrag(e, "rotate")} onPointerMove={onPointerMove} onPointerUp={endDrag} />
        </>
      )}
    </div>
  );
}
