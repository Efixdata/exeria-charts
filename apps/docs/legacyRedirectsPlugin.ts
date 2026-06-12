import type { Plugin } from "@docusaurus/types";
import { legacyRedirects } from "./legacyRedirects";

export default function legacyRedirectsPlugin(): Plugin {
  return {
    name: "legacy-redirects-plugin",
    async contentLoaded({ actions }) {
      for (const { from, to } of legacyRedirects) {
        actions.addRoute({
          path: from,
          component: "@site/src/components/LegacyRedirect",
          exact: true,
          props: { to },
        });
      }
    },
  };
}
