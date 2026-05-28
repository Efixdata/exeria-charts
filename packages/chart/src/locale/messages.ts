import WEBRCP from "../WebRCP";
import { resolveLocaleDictionary } from "./index";

export type ChartLocaleMessages = ReturnType<(typeof WEBRCP)["utils"]["getMessages"]>;

export function createLocaleMessages(
  localeId: string,
  messageOverrides?: Record<string, unknown>,
): ChartLocaleMessages {
  return WEBRCP.utils.getMessages(resolveLocaleDictionary(localeId, messageOverrides));
}
