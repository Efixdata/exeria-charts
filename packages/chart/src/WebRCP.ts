import WebRCPUtils from "./utils/webrcp.utils";
import { DEFAULT_LOCALE_ID, resolveLocaleDictionary } from "./locale";

const utils = new WebRCPUtils();

type WebRCPRuntime = {
  utils: WebRCPUtils;
  locale: {
    fusion: ReturnType<WebRCPUtils["getMessages"]>;
  };
  platformManifest?: {
    isWidget?: boolean;
    [key: string]: unknown;
  };
  triggerQueueEvent: (eventName: string, payload?: unknown) => void;
  newChartLastFocus?: unknown;
  [key: string]: unknown;
};

const webRCP: WebRCPRuntime = {
  utils,
  locale: {
    fusion: utils.getMessages(resolveLocaleDictionary(DEFAULT_LOCALE_ID)),
  },
  triggerQueueEvent: () => undefined,
  newChartLastFocus: undefined,
};

export function applyChartLocale(
  localeId: string,
  messageOverrides?: Record<string, unknown>,
): void {
  webRCP.locale.fusion = utils.getMessages(resolveLocaleDictionary(localeId, messageOverrides));
}

export default webRCP;
