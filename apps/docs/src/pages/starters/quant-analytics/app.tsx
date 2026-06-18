// @ts-ignore
import _Head from "@docusaurus/Head";

let Head = _Head as any;

import QuantAnalyticsApp from "@site/src/components/QuantAnalyticsApp";
import "../../../../../../packages/react-chart-ui/src/fonts.css";

export default function QuantAnalyticsLiveAppPage() {
  return (
    <>
      <Head>
        <title>Quant Analytics Dashboard — Live Starter | Exeria Charts</title>
        <meta
          name="description"
          content="Backtest dashboard with strategy presets, equity curve, and copy-paste wiring snippets. Five FX pairs, M15 and H1 static data."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
        />
      </Head>
      <QuantAnalyticsApp />
    </>
  );
}
