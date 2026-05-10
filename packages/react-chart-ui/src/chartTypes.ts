import type { ChartInstance } from "@dexer-io/chart";

export type NullableChartInstance = ChartInstance | null | undefined;

export interface ShareConfig {
	apiUri?: string;
	templateText?: string;
	sourceUrl?: string;
	twitterTextTemplate?: string;
	telegramTextTemplate?: string;
	watermarkSvg?: string;
	watermarkDataUrl?: string;
}
