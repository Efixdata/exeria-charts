// @ts-ignore
import _Head from "@docusaurus/Head";

let Head = _Head as any;

import FintechWealthApp from "@site/src/components/FintechWealthApp";
import "../../../../../../packages/react-chart-ui/src/fonts.css";

export default function FintechWealthBankAppPage() {
  return (
    <>
      <Head>
        <title>Retail Banking Demo — Light Wealth App | Exeria Charts</title>
        <meta
          name="description"
          content="Light-themed wealth management demo for traditional banking brands — portfolio overview, compare chart, and allocation."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
        />
      </Head>
      <FintechWealthApp defaultTheme="light" brandVariant="bank" lockTheme />
    </>
  );
}
