import dynamic from "next/dynamic";

const WebChartComponent = dynamic(() => import("../components/WebChartComponent"), {
  ssr: false,
}) as any;

export default function Web() {
  return <WebChartComponent />;
}
