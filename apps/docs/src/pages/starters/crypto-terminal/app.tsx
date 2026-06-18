// @ts-ignore
import _Head from "@docusaurus/Head";

let Head = _Head as any;

import CryptoTerminalApp from "@site/src/components/CryptoTerminalApp";
import "../../../../../../packages/react-chart-ui/src/fonts.css";

export default function CryptoTerminalLiveAppPage() {
  return (
    <>
      <Head>
        <title>Crypto Terminal — Live Starter | Exeria Charts</title>
        <meta
          name="description"
          content="Full-screen crypto trading terminal starter with live Binance data, ChartUI, indicators, and copy-paste source code."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
        />
      </Head>
      <CryptoTerminalApp />
    </>
  );
}
