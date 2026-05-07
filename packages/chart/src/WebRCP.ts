import locale from "./locale/en-US";
import WebRCPUtils from "./utils/webrcp.utils";

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
    fusion: utils.getMessages(locale),
  },
  triggerQueueEvent: () => undefined,
  newChartLastFocus: undefined,
};

export default webRCP;