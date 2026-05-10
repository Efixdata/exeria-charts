import Chart from "./Chart";
import type { ChartInstance, ChartOptions } from "./types";

export * from "./types";
export { Chart };

export function createChart(options: ChartOptions): ChartInstance {
	return new Chart(options);
}

export default Chart;
