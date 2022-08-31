import WebRCPUtils from "./utils/webrcp.utils";
import locale from "./locale/en-US";

const utils = new WebRCPUtils();

const webRCP = {
  utils,
  locale: {
    fusion: utils.getMessages(locale)
  }
}

export default webRCP;