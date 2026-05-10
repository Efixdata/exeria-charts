import FUSION from "../fusion";
import type { CoreFusionRuntime, CoreFusionStatic } from "../internal-types/fusion";
import type { RuntimeScriptConfig } from "../internal-types/scripts";

type FusionUiApi = CoreFusionStatic & {
  dialogs: {
    script: {
      show: (
        config: { key: string; config: RuntimeScriptConfig | null },
        onApply: (config: RuntimeScriptConfig) => void,
        onCancel: () => void,
        fusion: CoreFusionRuntime,
        panels: boolean,
        objects: unknown,
        locale: unknown,
      ) => void;
      hide: () => void;
    };
  };
};

const FUSION_UI = FUSION as unknown as FusionUiApi;

export function showFusionScriptDialog(
  config: { key: string; config: RuntimeScriptConfig | null },
  onApply: (config: RuntimeScriptConfig) => void,
  onCancel: () => void,
  fusion: CoreFusionRuntime,
  panels: boolean,
  objects: unknown,
  locale: unknown,
) {
  FUSION_UI.dialogs.script.show(config, onApply, onCancel, fusion, panels, objects, locale);
}

export function hideFusionScriptDialog() {
  FUSION_UI.dialogs.script.hide();
}

export function createFusionUniqueId() {
  return FUSION_UI.uniqueId();
}