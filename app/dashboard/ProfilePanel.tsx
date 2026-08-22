"use client";

import type { EditableProfile } from "./content-types";
import styles from "./content-panels.module.css";

export function ProfilePanel({ value, onChange }: { value: EditableProfile; onChange: (patch: Partial<EditableProfile>) => void }) {
  return (
    <section className="panel">
      <div className={styles.panelHeader}>
        <h3>Profile</h3>
        <p>What shows in your hero and about section.</p>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          Display name
          <input
            type="text"
            value={value.displayName}
            placeholder="Your name — falls back to @username if empty"
            maxLength={80}
            onChange={(e) => onChange({ displayName: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          Tagline
          <input
            type="text"
            value={value.tagline}
            placeholder="A short line under your name"
            maxLength={160}
            onChange={(e) => onChange({ tagline: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          Bio ({value.bio.length}/600)
          <textarea
            rows={3}
            value={value.bio}
            placeholder="A short intro shown near the top of your page"
            maxLength={600}
            onChange={(e) => onChange({ bio: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          About (long form, optional)
          <textarea
            rows={6}
            value={value.aboutLong}
            placeholder="Longer background, shown instead of Bio if you fill it in"
            maxLength={8000}
            onChange={(e) => onChange({ aboutLong: e.target.value })}
          />
          <span className={styles.hint}>If set, this replaces Bio on your page — leave empty to just use the short bio above.</span>
        </label>
      </div>
    </section>
  );
}
