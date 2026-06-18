// @ts-ignore
import _Head from "@docusaurus/Head";

let Head = _Head as any;

import SignalTerminalApp from "@site/src/components/SignalTerminalApp";
import "../../../../../../packages/react-chart-ui/src/fonts.css";

export default function SignalTerminalLiveAppPage() {
  return (
    <>
      <Head>
        <title>Signal Terminal — Live Starter | Exeria Charts</title>
        <meta
          name="description"
          content="Signal screener starter — filterable feed, sparklines, expandable chart analysis, trade panel, alerts and broker automation settings."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
        />
      </Head>
      <SignalTerminalApp />
    </>
  );
}
