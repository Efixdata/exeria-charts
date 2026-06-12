import type { RightDockTab, TimeframeId } from "./constants";

export type MobilePanel = "watchlist" | "chart" | "market";

export type WorkspacePresetId = "trader" | "chart-focus" | "scalper" | "saved";

export type WorkspaceLayoutState = {
  focusMode: boolean;
  rightTab: RightDockTab;
  mobilePanel: MobilePanel;
  timeframeId: TimeframeId;
};

export type WorkspacePreset = {
  id: Exclude<WorkspacePresetId, "saved">;
  label: string;
  description: string;
  layout: WorkspaceLayoutState;
};

export const WORKSPACE_PRESET_STORAGE_KEY = "exeria-crypto-terminal-workspace-layout";

export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayoutState = {
  focusMode: false,
  rightTab: "trade",
  mobilePanel: "chart",
  timeframeId: "hour",
};

export const WORKSPACE_PRESETS: WorkspacePreset[] = [
  {
    id: "trader",
    label: "Trader",
    description: "Watchlist, chart, and trade ticket",
    layout: {
      focusMode: false,
      rightTab: "trade",
      mobilePanel: "chart",
      timeframeId: "hour",
    },
  },
  {
    id: "chart-focus",
    label: "Chart focus",
    description: "Full-width chart — press F anytime",
    layout: {
      focusMode: true,
      rightTab: "trade",
      mobilePanel: "chart",
      timeframeId: "hour",
    },
  },
  {
    id: "scalper",
    label: "Scalper",
    description: "Depth + tape open, 15m timeframe",
    layout: {
      focusMode: false,
      rightTab: "book",
      mobilePanel: "market",
      timeframeId: "m15",
    },
  },
];

export function loadSavedWorkspaceLayout(): WorkspaceLayoutState | null {
  try {
    const raw = window.localStorage.getItem(WORKSPACE_PRESET_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as WorkspaceLayoutState & { workspaceMode?: string };
    const { workspaceMode: _ignored, ...layout } = parsed;
    return layout;
  } catch {
    return null;
  }
}

export function saveWorkspaceLayout(layout: WorkspaceLayoutState): void {
  window.localStorage.setItem(WORKSPACE_PRESET_STORAGE_KEY, JSON.stringify(layout));
}
