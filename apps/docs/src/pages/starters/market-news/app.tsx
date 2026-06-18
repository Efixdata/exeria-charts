import Head from "@docusaurus/Head";
import MarketNewsApp from "@site/src/components/MarketNewsApp";
import "../../../../../../packages/react-chart-ui/src/fonts.css";

export default function MarketNewsLiveAppPage() {
  return (
    <>
      <Head>
        <title>Interactive Market News — Live Starter | Exeria Charts</title>
        <meta
          name="description"
          content="Editorial article demo with multi-pair compare charts, EUR/USD news markers, and copy-paste embed snippets."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
        />
      </Head>
      <MarketNewsApp />
    </>
  );
}
