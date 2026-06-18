// @ts-ignore
import _Head from "@docusaurus/Head";

let Head = _Head as any;

import ForexOpportunityApp from "@site/src/components/ForexOpportunityApp";
import "../../../../../../packages/react-chart-ui/src/fonts.css";

export default function ForexOpportunityLiveAppPage() {
  return (
    <>
      <Head>
        <title>FX Opportunity Radar — Live Starter | Exeria Charts</title>
        <meta
          name="description"
          content="Forex opportunity radar with arb zones, strategy signals, and news dots published directly on the chart. Copy starter code and run locally."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
        />
      </Head>
      <ForexOpportunityApp />
    </>
  );
}
