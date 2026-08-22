"use client";

import { useState, type ChangeEvent } from "react";
import { uploadProjectMedia } from "./actions";
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";
import { formatDuration, newLocalId, type EditableMedia, type EditableProject } from "./content-types";
import { videoThumbnailUrl } from "@/lib/media";
import styles from "./content-panels.module.css";

const MAX_MEDIA_PER_PROJECT = 12;

interface ProjectsPanelProps {
  projects: EditableProject[];
  onChange: (projects: EditableProject[]) => void;
}

function emptyProject(): EditableProject {
  return {
    id: newLocalId(),
    title: "",
    description: "",
    role: "",
    technologiesText: "",
    collaboratorsText: "",
    githubUrl: "",
    demoUrl: "",
    researchUrl: "",
    media: [],
  };
}

// Reads duration from the file the browser already has in memory —
// no upload round-trip needed just to find out how long a clip is.
// Best-effort only: some codecs/containers never fire loadedmetadata
// reliably in every browser, so a null duration is expected sometimes,
// not a bug (see the durationSeconds comment in prisma/schema.prisma).
function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const cleanup = (result: number | null) => {
      URL.revokeObjectURL(video.src);
      resolve(result);
    };
    video.onloadedmetadata = () => cleanup(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => cleanup(null);
    video.src = URL.createObjectURL(file);
  });
}

export function ProjectsPanel({ projects, onChange }: ProjectsPanelProps) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  function update(id: string, patch: Partial<EditableProject>) {
    onChange(projects.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function remove(id: string, title: string) {
    if (!window.confirm(`Delete "${title || "Untitled project"}"? This can't be undone once you save.`)) return;
    onChange(projects.filter((p) => p.id !== id));
  }

  async function addMedia(projectId: string, event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const room = MAX_MEDIA_PER_PROJECT - project.media.length;
    if (room <= 0) return;

    setUploadingFor(projectId);
    const added: EditableMedia[] = [];
    for (const file of files.slice(0, room)) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadProjectMedia(formData);
      if (result.error || !result.url || !result.type) continue;
      const durationSeconds = result.type === "video" ? await readVideoDuration(file) : null;
      added.push({ id: newLocalId(), type: result.type, url: result.url, durationSeconds });
    }
    setUploadingFor(null);
    if (added.length > 0) {
      update(projectId, { media: [...project.media, ...added] });
    }
  }

  function removeMedia(projectId: string, mediaId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    update(projectId, { media: project.media.filter((m) => m.id !== mediaId) });
  }

  function moveMedia(projectId: string, index: number, dir: -1 | 1) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const target = index + dir;
    if (target < 0 || target >= project.media.length) return;
    const media = [...project.media];
    [media[index], media[target]] = [media[target], media[index]];
    update(projectId, { media });
  }

  function move(id: string, dir: -1 | 1) {
    const index = projects.findIndex((p) => p.id === id);
    const target = index + dir;
    if (target < 0 || target >= projects.length) return;
    const next = [...projects];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function add() {
    onChange([...projects, emptyProject()]);
  }

  return (
    <section className="panel">
      <div className={styles.panelHeader}>
        <h3>Projects</h3>
        <p>What actually shows in your Projects section — order here is the order on your page.</p>
      </div>
      <div className={styles.itemList}>
        {projects.length === 0 && <p className={styles.emptyState}>No projects yet — add your first one below.</p>}
        {projects.map((project, index) => (
          <div className={styles.itemCard} key={project.id}>
            <div className={styles.itemHeader}>
              <h4>{project.title || "Untitled project"}</h4>
              <div className={styles.itemActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  disabled={index === 0}
                  onClick={() => move(project.id, -1)}
                  aria-label="Move up"
                >
                  <ChevronUpIcon size={14} />
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  disabled={index === projects.length - 1}
                  onClick={() => move(project.id, 1)}
                  aria-label="Move down"
                >
                  <ChevronDownIcon size={14} />
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => remove(project.id, project.title)}
                  aria-label="Delete project"
                >
                  <CloseIcon size={14} />
                </button>
              </div>
            </div>

            <label className={styles.field}>
              Title
              <input type="text" value={project.title} maxLength={120} onChange={(e) => update(project.id, { title: e.target.value })} />
            </label>
            <label className={styles.field}>
              Description
              <textarea
                rows={2}
                value={project.description}
                maxLength={2000}
                onChange={(e) => update(project.id, { description: e.target.value })}
              />
            </label>
            <div className={styles.itemGrid}>
              <label className={styles.field}>
                Role
                <input type="text" value={project.role} maxLength={120} onChange={(e) => update(project.id, { role: e.target.value })} />
              </label>
              <label className={styles.field}>
                Technologies
                <input
                  type="text"
                  value={project.technologiesText}
                  placeholder="React, TypeScript, Prisma"
                  onChange={(e) => update(project.id, { technologiesText: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                Collaborators
                <input
                  type="text"
                  value={project.collaboratorsText}
                  placeholder="Comma-separated names"
                  onChange={(e) => update(project.id, { collaboratorsText: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                GitHub URL
                <input
                  type="url"
                  value={project.githubUrl}
                  placeholder="https://github.com/..."
                  onChange={(e) => update(project.id, { githubUrl: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                Demo URL
                <input
                  type="url"
                  value={project.demoUrl}
                  placeholder="https://..."
                  onChange={(e) => update(project.id, { demoUrl: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                Research/write-up URL
                <input
                  type="url"
                  value={project.researchUrl}
                  placeholder="https://..."
                  onChange={(e) => update(project.id, { researchUrl: e.target.value })}
                />
              </label>
            </div>

            <div className={styles.field}>
              Media ({project.media.length}/{MAX_MEDIA_PER_PROJECT})
              <div className={styles.mediaGrid}>
                {project.media.map((m, i) => (
                  <div className={styles.mediaThumb} key={m.id}>
                    {m.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element -- small editor thumbnail of a just-uploaded file, not the public render path
                      <img src={m.url} alt="" />
                    ) : (
                      <video src={videoThumbnailUrl(m.url)} muted preload="metadata" />
                    )}
                    {m.type === "video" && m.durationSeconds != null && (
                      <span className={styles.mediaDuration}>{formatDuration(m.durationSeconds)}</span>
                    )}
                    <div className={styles.mediaThumbActions}>
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveMedia(project.id, i, -1)}
                        aria-label="Move media earlier"
                      >
                        <ChevronLeftIcon size={11} />
                      </button>
                      <button
                        type="button"
                        disabled={i === project.media.length - 1}
                        onClick={() => moveMedia(project.id, i, 1)}
                        aria-label="Move media later"
                      >
                        <ChevronRightIcon size={11} />
                      </button>
                      <button type="button" onClick={() => removeMedia(project.id, m.id)} aria-label="Remove media">
                        <CloseIcon size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {project.media.length < MAX_MEDIA_PER_PROJECT && (
                <label className="btn-secondary" style={{ cursor: "pointer", alignSelf: "flex-start", marginTop: 8 }}>
                  {uploadingFor === project.id ? "Uploading…" : "+ Add media"}
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                    onChange={(e) => addMedia(project.id, e)}
                    disabled={uploadingFor === project.id}
                    style={{ display: "none" }}
                  />
                </label>
              )}
              <span className={styles.hint}>Photos and short clips (MP4/WebM, under 20MB) for this project — shown as a gallery on your page.</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <button type="button" className="btn-secondary" onClick={add}>
          + Add project
        </button>
      </div>
    </section>
  );
}
