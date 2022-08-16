import WebRCPUtils from "./utils/webrcp.utils";

console.log(WebRCPUtils);

const utils = new WebRCPUtils();
const localeData = "en";

const webRCP = {
  utils,
  locale: {
    fusion: utils.getMessages(localeData)
  }
}

export default webRCP;