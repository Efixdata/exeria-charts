import { useEffect, useRef, useState } from "react";
import {
  WORKSPACE_PRESETS,
  loadSavedWorkspaceLayout,
  saveWorkspaceLayout,
  type WorkspaceLayoutState,
  type WorkspacePresetId,
} from "./workspacePresets";
import styles from "./cryptoTerminalApp.module.css";

type WorkspacePresetMenuProps = {
  activePresetId: WorkspacePresetId | null;
  currentLayout: WorkspaceLayoutState;
  onApply: (layout: WorkspaceLayoutState, presetId: WorkspacePresetId) => void;
};

export default function WorkspacePresetMenu({
  activePresetId,
  currentLayout,
  onApply,
}: WorkspacePresetMenuProps) {
  const [open, setOpen] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHasSaved(loadSavedWorkspaceLayout() !== null);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const handleSaveCurrent = () => {
    saveWorkspaceLayout(currentLayout);
    setHasSaved(true);
    setOpen(false);
  };

  return (
    <div className={styles.presetMenuRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.ghostButton}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        Layout
      </button>
      {open ? (
        <div className={styles.presetMenu} role="menu" aria-label="Workspace presets">
          {WORKSPACE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              role="menuitem"
              className={[
                styles.presetMenuItem,
                activePresetId === preset.id ? styles.presetMenuItemActive : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                onApply(preset.layout, preset.id);
                setOpen(false);
              }}
            >
              <strong>{preset.label}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
          {hasSaved ? (
            <button
              type="button"
              role="menuitem"
              className={[
                styles.presetMenuItem,
                activePresetId === "saved" ? styles.presetMenuItemActive : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                const saved = loadSavedWorkspaceLayout();
                if (saved) {
                  onApply(saved, "saved");
                }
                setOpen(false);
              }}
            >
              <strong>Saved layout</strong>
              <span>Restore your last saved workspace</span>
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={styles.presetMenuSave}
            onClick={handleSaveCurrent}
          >
            Save current layout
          </button>
        </div>
      ) : null}
    </div>
  );
}
