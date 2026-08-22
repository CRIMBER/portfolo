"use client";

import { newLocalId, SOCIAL_PLATFORMS, type EditableSocialLink } from "./content-types";
import styles from "./content-panels.module.css";

interface SocialLinksPanelProps {
  links: EditableSocialLink[];
  onChange: (links: EditableSocialLink[]) => void;
}

export function SocialLinksPanel({ links, onChange }: SocialLinksPanelProps) {
  function update(id: string, patch: Partial<EditableSocialLink>) {
    onChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function remove(id: string) {
    onChange(links.filter((l) => l.id !== id));
  }

  function add() {
    onChange([...links, { id: newLocalId(), platform: "WEBSITE", url: "" }]);
  }

  return (
    <section className="panel">
      <div className={styles.panelHeader}>
        <h3>Social links</h3>
        <p>Shown at the bottom of your page.</p>
      </div>
      <div className={styles.itemList}>
        {links.length === 0 && <p className={styles.emptyState}>No links yet.</p>}
        {links.map((link) => (
          <div className={styles.socialRow} key={link.id}>
            <select value={link.platform} onChange={(e) => update(link.id, { platform: e.target.value as EditableSocialLink["platform"] })}>
              {SOCIAL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            <input type="text" value={link.url} placeholder="https://..." onChange={(e) => update(link.id, { url: e.target.value })} />
            <button type="button" className={styles.iconButton} onClick={() => remove(link.id)} aria-label="Delete link">
              ×
            </button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <button type="button" className="btn-secondary" onClick={add}>
          + Add link
        </button>
      </div>
    </section>
  );
}
