// import { Button } from "ui";
import dynamic from 'next/dynamic'
const ChartComponent = dynamic(() => import('ui').then((mod) => mod.ChartComponent), {ssr: false})


export default function Web() {
  return (
    <div>
      <h1>Web</h1>
      {/* <Button /> */}
      <ChartComponent />
    </div>
  );
}
