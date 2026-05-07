import WEBRCP from "../../WebRCP";
import LIB from "../../utils/chartingCommons";
import { between, calcLine, isPointInCircle, pointsDistance, findMidPoint, getLinePointNearestMouse, calcPointOnPerpendicularLine, movePointByDistance, findAnchorPointForXY, findAnchorPointArrowForXY, drawAnchor, drawAnchors, drawAnchorArrow, drawAnchorsArrow, drawIndicatorMarker } from '../../utils/objects-lib';
import { renderPriceText, measurePriceTextWidth } from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import type { ShapeRuntime, ShapeTagRuntime } from "./_sharedTypes";

function TimeBetObject(this: ShapeRuntime) {

	this.boxBeginningX = 0;

	this.getColors = function(o: LegacyShapeObject, isWinning: boolean) {
		const defaultColor = o.color ? o.color : WEBRCP.utils.colorManager.getColor('defaultToolColor');

		const colors = {
			toolColor: defaultColor,
			arrowColor: defaultColor
		};
		
		const winningColor = o.winningColor ? o.winningColor : WEBRCP.utils.colorManager.getColor('chartGreen');
		const losingColor = o.losingColor ? o.losingColor : WEBRCP.utils.colorManager.getColor('chartRed');
		const wonColor = o.wonColor ? o.wonColor : WEBRCP.utils.colorManager.getColor('chartGreen');

		if (o.status === "PENDING_START" || o.status === "ACTIVE") {
			if (isWinning) colors.toolColor = winningColor;
			else colors.toolColor = losingColor;

			if (o.predictedDirection === 'UP') colors.arrowColor = winningColor;
			else colors.arrowColor = losingColor;
		} else if (o.status === "FINISHED" && isWinning) {
			colors.toolColor = wonColor;
			colors.arrowColor = wonColor;
		}

		return colors;
	}

	this.isWinning = function(o: LegacyShapeObject, model: any, seriesManager: any) {
		let isWinning = o.isWinning;

		if (o.status === "ACTIVE") {
			const lastPrice = seriesManager[model.mainSeries].data[seriesManager[model.mainSeries].data.length-1]['c'];
			if (o.predictedDirection === "UP") {
				if (lastPrice > o.price) isWinning = true;
				else isWinning = false;
			} else if (o.predictedDirection === "DOWN") {
				if (lastPrice < o.price) isWinning = true;
				else isWinning = false;
			}
		}

		return isWinning;
	}

	this.render	= function(o: LegacyShapeObject, ctx: CanvasRenderingContext2D, renderer: any, model: any, panel: any, seriesManager: any) {
		const pts = this.getPoints(o, renderer, panel, model, seriesManager);
		if (!pts) return;
		const status = o.status;
		let isWinning = this.isWinning(o, model, seriesManager);

		let { toolColor, arrowColor } = this.getColors(o, isWinning);
		let globalAlpha = 1;

		if (status === "PENDING_START" || status === "PENDING_FINISH") {
			globalAlpha = 0.5;
		}

		const addShadow = () => {
			ctx.shadowColor = "#0b1b28";//"rgba(0, 0, 0, 0.7)";
			ctx.shadowBlur = 2;
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 1;
		}

		const removeShadow = () => {
			ctx.shadowColor = "rgba(0, 0, 0, 0)";
			ctx.shadowBlur = 0;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
		}
		const roundedContext = ctx as any;

		ctx.save();
		ctx.lineWidth = o.width;
		ctx.setLineDash(o.dash ? o.dash : []);
		ctx.fillStyle = toolColor;
		ctx.strokeStyle = toolColor;
		ctx.globalAlpha = globalAlpha;
		
		let text;

		if (isWinning) {
			text = '+$' + o.reward;
		} else {
			text = "-$" + o.bet;
		}

		let x0 = pts[0].x;
		let y0 = pts[0].y;
		let x1 = pts[1].x;
		let y1 = pts[1].y;

		const measuredText = ctx.measureText(text);
		const rightArrowWidth = 10;
		const rightArrowHeight = 10;
		const halfRightArrowHeight = rightArrowHeight/2;
		const leftArrowWidth = 20;
		const leftArrowHeight = 20;
		const halfLeftArrowHeight = leftArrowHeight/2;
		const directionBoxWidth = 20;
		const boxPadding = {
			left: 5,
			right: 2
		};
		const boxWidth = Math.ceil(measuredText.width + boxPadding.left + boxPadding.right + directionBoxWidth);
		let boxBeginningX = x0 - leftArrowWidth - boxWidth;
		this.boxBeginningX = boxBeginningX;
		
		ctx.save();
		const outerBorderWidth = 0;
		// White Border
		// ctx.fillStyle = "#fff"
		// ctx.beginPath();
		// ctx.moveTo(x0 + outerBorderWidth + outerBorderWidth, y0);
		// ctx.lineTo(x0 - leftArrowWidth, y0 + halfLeftArrowHeight + outerBorderWidth);
		// ctx.lineTo(boxBeginningX - outerBorderWidth, y0 + halfLeftArrowHeight + outerBorderWidth);
		// ctx.lineTo(boxBeginningX - outerBorderWidth, y0 - halfLeftArrowHeight - outerBorderWidth);
		// ctx.lineTo(x0 - leftArrowWidth, y0 - halfLeftArrowHeight - outerBorderWidth);
		// ctx.closePath();
		// ctx.fill();

		// Border
		// const innerBorderWidth = 1;
		// ctx.fillStyle = "#000"
		// ctx.beginPath();
		// ctx.moveTo(x0 + innerBorderWidth + innerBorderWidth, y0);
		// ctx.lineTo(x0 - leftArrowWidth, y0 + halfLeftArrowHeight + innerBorderWidth);
		// ctx.lineTo(boxBeginningX - innerBorderWidth, y0 + halfLeftArrowHeight + innerBorderWidth);
		// ctx.lineTo(boxBeginningX - innerBorderWidth, y0 - halfLeftArrowHeight - innerBorderWidth);
		// ctx.lineTo(x0 - leftArrowWidth, y0 - halfLeftArrowHeight - innerBorderWidth);
		// ctx.closePath();
		// ctx.fill();

		ctx.restore();
		// addShadow();

		// Rounded box
		ctx.beginPath();
		roundedContext.roundRect(boxBeginningX, y0 - halfLeftArrowHeight, boxWidth, leftArrowHeight, [6, 0, 0, 6]);
		// ctx.rect(boxBeginningX, y0 - halfLeftArrowHeight, boxWidth, leftArrowHeight);
		ctx.fill();

		// removeShadow();

		// Arrow box
		ctx.fillStyle = arrowColor;
		ctx.beginPath();
		roundedContext.roundRect(boxBeginningX, y0 - halfLeftArrowHeight, leftArrowWidth, leftArrowHeight, [6, 0, 0, 6]);
		// ctx.rect(boxBeginningX, y0 - halfLeftArrowHeight, leftArrowWidth, leftArrowHeight);
		ctx.fill();

		// Image arrow
		ctx.strokeStyle = "white";
		ctx.lineCap = "round";
		ctx.shadowBlur = 0;
		ctx.beginPath();

		const arrowLeftEdge = boxBeginningX + 6.5;
		const arrowRightEdge = boxBeginningX + 13.5;
		const arrowBottomEdge = y0 + 3.5;
		const arrowTopEdge = y0 - 3.5;

		if (o.predictedDirection === "UP") {
			ctx.moveTo(arrowLeftEdge, arrowBottomEdge);
			ctx.lineTo(arrowRightEdge, arrowTopEdge);
			ctx.lineTo(arrowRightEdge, arrowTopEdge + 6);
			ctx.moveTo(arrowRightEdge, arrowTopEdge);
			ctx.lineTo(arrowRightEdge - 6, arrowTopEdge);
		} else if (o.predictedDirection === "DOWN") {
			ctx.moveTo(arrowLeftEdge, arrowTopEdge);
			ctx.lineTo(arrowRightEdge, arrowBottomEdge);
			ctx.lineTo(arrowRightEdge - 6, arrowBottomEdge);
			ctx.moveTo(arrowRightEdge, arrowBottomEdge);
			ctx.lineTo(arrowRightEdge, arrowBottomEdge - 6);
		}
		
		ctx.stroke();
		ctx.strokeStyle = toolColor;

		// Reward text
		ctx.textBaseline = "middle";
		ctx.fillStyle = o.textColor ? o.textColor : WEBRCP.utils.colorManager.getColor('defaultToolTextColor');
		ctx.fillText(
			text,
			boxBeginningX + directionBoxWidth + boxPadding.left,
			y0
		);
		ctx.fillStyle = toolColor;
		ctx.lineWidth = 1;
		ctx.shadowBlur = 2;

		// addShadow();

		// Left arrow
		ctx.beginPath();
		ctx.moveTo(x0, y0);
		ctx.lineTo(x0 - leftArrowWidth, y0 + halfLeftArrowHeight);
		ctx.lineTo(x0 - leftArrowWidth, y0 - halfLeftArrowHeight);
		ctx.closePath();
		ctx.fill();

		// Right arrow
		ctx.beginPath();
		ctx.moveTo(x1, pts[1].y);
		ctx.lineTo(x1 + rightArrowWidth, y1 + halfRightArrowHeight);
		ctx.lineTo(x1 + rightArrowWidth, y1 - halfRightArrowHeight);
		ctx.closePath();
		ctx.fill();

		x0 += 0.5;
		y0 += 0.5;
		x1 += 0.5;
		y1 += 0.5;
		boxBeginningX += 0.5;


		// Middle line
		ctx.beginPath();
		ctx.moveTo(x0 + outerBorderWidth + outerBorderWidth, y0);
		ctx.lineTo(x1, y1);
		ctx.stroke();

		// removeShadow();

		// Line
		ctx.setLineDash([3, 2]);	

		ctx.beginPath();
		if (o.priceTag) {
			ctx.moveTo(x1 + rightArrowWidth, y1);
			ctx.lineTo(panel._width, y1);
		}
		ctx.moveTo(x1, 0);
		ctx.lineTo(x1, panel._offset + panel._height);
		ctx.stroke();		

		// Separator
		ctx.setLineDash([]);
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.globalAlpha = 0.2;
		ctx.strokeStyle = "#ffffff";
		ctx.moveTo(boxBeginningX + directionBoxWidth, y0 - halfLeftArrowHeight);
		ctx.lineTo(boxBeginningX + directionBoxWidth, y0 + halfLeftArrowHeight - 1);
		ctx.stroke();

		ctx.restore();
	}

	this.renderOverlay = function (o: LegacyShapeObject, octx: CanvasRenderingContext2D, renderer: any, model: any, panel: any, seriesManager: any) {
		return;
	}

	this.hit = function (x: number, y: number, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		const pts = this.getPoints(o, renderer, panel, model, seriesManager);
		if (!pts) return;
		const fromY = pts[0].y - 10;
		const toY = fromY + 20;
		if (x > this.boxBeginningX &&
			x < pts[1].x &&
			y > fromY &&
			y < toY) {
			return true;
		}
		return false;
	}

	this.mouseDown	=	function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		return;
	}
	this.mouseDrag = function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		return;
	};

	this.stageDrag = function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		return;
	};

	this.stageUp = function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		return;
	};

	this.stageOut =	function (e: any, o: LegacyShapeObject, renderer: any, interactor: any, model: any, panel: any, seriesManager: any) {
		this.stageUp(e, o, renderer, interactor, model, panel, seriesManager);
	};

	this.getPoints	= function (o: LegacyShapeObject, renderer: any, panel: any, model: any, seriesManager: any) {
		var s0 = seriesManager[model.mainSeries].data[0]['stamp'];
		if (typeof o.startTime === "number" && o.startTime < s0) return undefined;
		var fV = LIB.getReferenceValue(o, model, seriesManager);
		const y = renderer.getYCoordinateForPrice(o.price, {panelHeight: panel._height, minValue: panel.vMin, maxValue: panel.vMax, valueAxisMode: panel.valueAxisMode, fV});
		let startStamp;
		let endStamp;
		let pts = [];

		if (o.startTime === "now" && typeof o.timeRange === "number") {
			var lastIndex = seriesManager[model.mainSeries].data.length-1;
			const now = Date.now();
			startStamp = now;
			endStamp = now + o.timeRange;

			pts[0] = {
				x: Math.floor(renderer.getIndexPoint(lastIndex, model) + model.periodWidth / 2),
				y,
				index: lastIndex,
				stamp: startStamp
			}
		} else if (typeof o.startTime === "number" && typeof o.timeRange === "number") {
			endStamp = o.startTime + o.timeRange;

			pts[0] = {
					x: Math.floor(renderer.getStampPoint(o.startTime, model, seriesManager) + model.periodWidth / 2),
					y: y,
					index: renderer.getStampIndex(o.startTime, model, seriesManager),
					stamp: o.startTime
				}
		} else {
			throw Error("Invalid TimeRange config. startTime should be numeric or 'now' and timeRange should be numeric.")
		}

		pts[1] = {
			x: Math.floor(renderer.getStampPoint(endStamp, model, seriesManager) + model.periodWidth / 2),
			y: y,
			index: renderer.getStampIndex(endStamp, model, seriesManager),
			stamp: endStamp
		};

		if (pts[1].x === pts[0].x) {
			pts[1].x += 1;
			pts[0].x -= 2;
		}

		return pts;
	}

	this.postRenderOverlay = function(o: LegacyShapeObject, ctx: CanvasRenderingContext2D, renderer: any, model: any, panel: any, seriesManager: any) {
		if (o.priceTag) {
			const pts = this.getPoints(o, renderer, panel, model, seriesManager);
			if (!pts) return;
			const color = this.getColors(o, this.isWinning(o, model, seriesManager)).toolColor;
			const textColor = WEBRCP.utils.getContrastColor(color);
			renderer.drawPriceTag(ctx, model, panel, pts[0].y, color, textColor, o.anchors[0].value, 'real', 'TRADE');
		}
	}
}


const TimeBetObjectCtor: new (...args: any[]) => any = TimeBetObject as any;
export { TimeBetObjectCtor as TimeBetObject };
