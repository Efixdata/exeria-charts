// import { Button } from "ui";
import React from "react";
import dynamic from "next/dynamic";
// const WebChartComponent = dynamic(() => import('../components/WebChartComponent').then((mod) => mod.WebChartComponent), {ssr: false})
const WebChartComponent = dynamic(
  () => import("../components/WebChartComponent").then((mod) => mod.WebChartComponent),
  { ssr: false }
);
// import WebChartComponent from "../components/WebChartComponent";

export default function Web() {
  return <WebChartComponent />;
}
