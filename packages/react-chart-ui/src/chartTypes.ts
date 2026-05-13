import type { ChartInstance } from "@efixdata/exeria-chart";

export type NullableChartInstance = ChartInstance | null | undefined;

interface ChartUIThemeButtonState {
	color?: string;
	activeColor?: string;
	hoverColor?: string;
	hoverBackground?: string;
	activeBackground?: string;
}

export interface ChartUITheme {
	border?: {
		inner?: string;
		outter?: string;
		radius?: number;
	};
	gap?: number;
	accentColor?: string;
	buttons?: ChartUIThemeButtonState;
	radioButton?: {
		buttons?: ChartUIThemeButtonState;
		background?: string;
	};
	toolbar?: {
		buttons?: ChartUIThemeButtonState;
		background?: string;
		showShareChartButton?: boolean;
		showChartScaleSwitch?: boolean;
		showCurrency?: boolean;
		topMenuPosition?: string;
	};
	subMenu: {
		buttons?: ChartUIThemeButtonState;
		background?: string;
	};
	splitButton: {
		openBackground?: string;
		hoverBackground?: string;
		openColor?: string;
		hoverColor?: string;
		arrowHoverBackground?: string;
		arrowColor?: string;
		arrowOpenColor?: string;
	};
	dialog: {
		backgroundColor?: string;
		titleColor?: string;
		textColor?: string;
		dividerColor?: string;
		itemTitleColor?: string;
		itemSubTitleColor?: string;
		itemHoverBackgroundColor?: string;
	};
	inputs: {
		backgroundColor?: string;
		placeholderColor?: string;
		textColor?: string;
		labelColor?: string;
	};
	scrollBar: {
		trackColor?: string;
		thumbColor?: string;
		thumbHoverColor?: string;
	};
}

export interface ShareConfig {
	apiUri?: string;
	templateText?: string;
	sourceUrl?: string;
	twitterTextTemplate?: string;
	telegramTextTemplate?: string;
	watermarkSvg?: string;
	watermarkDataUrl?: string;
}
