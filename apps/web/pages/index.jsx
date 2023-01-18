// import { Button } from "ui";
import React from "react";
import dynamic from 'next/dynamic';
// const WebChartComponent = dynamic(() => import('../components/WebChartComponent').then((mod) => mod.WebChartComponent), {ssr: false})
const WebChartComponent = dynamic(() => import('../components/WebChartComponent').then((mod) => mod.WebChartComponent), {ssr: false})
// import WebChartComponent from "../components/WebChartComponent";

const smallChartConfig = {margin: '100px 20px', height: 'calc(100vh - 416px)', width: 'calc(100vw - 56px)', boxSizing: 'border-box'};
// USAGE: <div style={smallChartConfig}>

export default function Web() {
  return (
    <div>
      <WebChartComponent />
    </div>
  );
}
