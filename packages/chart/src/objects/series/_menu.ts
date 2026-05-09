import type {
  SeriesMenuChart,
  SeriesMenuConfig,
  SeriesMenuItems,
  SeriesMenuObject,
} from "./_sharedTypes";

const MENU_ICON = "context-menu-icon";
const MENU_ICON_CHECKED =
  "context-menu-icon webrcp-icon-checked webrcp-dark-white webrcp-light-white";
const MENU_ICON_UNCHECKED =
  "context-menu-icon webrcp-icon-unchecked webrcp-dark-white webrcp-light-white";

function getRenderModeIcon(object: SeriesMenuObject, mode: string) {
  return object.renderAs === mode ? MENU_ICON_CHECKED : MENU_ICON;
}

function getToggleIcon(isChecked: boolean) {
  return isChecked ? MENU_ICON_CHECKED : MENU_ICON_UNCHECKED;
}

export function createSeriesMenu<TObject extends SeriesMenuObject>(
  chart: SeriesMenuChart,
  object: TObject,
  config: SeriesMenuConfig<TObject>
): SeriesMenuItems | null {
  if (object.renderAs === "Band") return null;

  const menuItems: SeriesMenuItems = {};

  for (const renderMode of config.renderModes) {
    menuItems[renderMode.key] = {
      name: chart.options.locale.getMessage(renderMode.labelKey, renderMode.fallback),
      icon: () => getRenderModeIcon(object, renderMode.mode),
      callback: () => {
        config.selectRenderMode(renderMode.mode, object, chart);
        return true;
      },
    };
  }

  if (config.toggles && config.toggles.length > 0) {
    menuItems.sep1 = "---------";

    for (const toggle of config.toggles) {
      menuItems[toggle.key] = {
        name: chart.options.locale.getMessage(toggle.labelKey, toggle.fallback),
        icon: () => getToggleIcon(toggle.isChecked(object)),
        callback: () => {
          toggle.toggle(object);
          return true;
        },
      };
    }
  }

  return menuItems;
}