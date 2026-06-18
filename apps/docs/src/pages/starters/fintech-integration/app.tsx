import Head from "@docusaurus/Head";
import FintechWealthApp from "@site/src/components/FintechWealthApp";
import "../../../../../../packages/react-chart-ui/src/fonts.css";

export default function FintechWealthLiveAppPage() {
  return (
    <>
      <Head>
        <title>Consumer Fintech Demo — Live Starter | Exeria Charts</title>
        <meta
          name="description"
          content="Minimalist wealth app demo with multi-asset compare charts, live Binance data, and copy-paste starter code."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
        />
      </Head>
      <FintechWealthApp />
    </>
  );
}
