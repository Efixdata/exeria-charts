import LIB from "./chartingCommons";
import WEBRCP from "../WebRCP";

/**
 * 
 * @param circle - {x,y,r}
 * @param x
 * @param y
 */
export function isPointInCircle(circle, x, y){
	if(Math.pow((x - circle.x),2) + Math.pow((y - circle.y),2) < Math.pow(circle.r,2))
		return true;
	else
		return false;
}

/**
 * 
 * @param rectangle - {x1,y1,x2,y2} - punkty przekatnej
 * @param x 
 * @param y
 * @returns {Boolean}
 */
//  export function isPointInRect(rectangle, x, y, tolerance){ // NOT USED
// 	var t = 0;
// 	if(tolerance) t = tolerance;
// 	var result = false;
// 	if ( between(rectangle.x1,x,rectangle.x2,t) && between(rectangle.y1,y,rectangle.y2,t) ){
// 		result = true;
// 	}
// 	return result;
// }

/**
 * 
 * @param point1 - {x,y}
 * @param point2 - {x,y}
 */
 export function pointsDistance(point1, point2){
	var dx2=point1.x-point2.x;
	var dy2=point1.y-point2.y;
	return Math.abs(Math.sqrt(dx2*dx2+dy2*dy2));
}

export function findMidPoint(point1, point2){
	var x = (point1.x+point2.x)/2;
	var y = (point1.y+point2.y)/2;
	return {x:x, y:y};
}

/**
 * Get point from line, which is nearest to (x,y)
 * @param line - {a,b}
 * @param x - point X
 * @param y - point Y
 * @returns  - point {x,y}
 */
 export function getLinePointNearestMouse (line,x,y) {
	var lerp=function(a,b,x){ return(a+x*(b-a)); };
	var dx=line.x1-line.x0;
	var dy=line.y1-line.y0;
	var t=((x-line.x0)*dx+(y-line.y0)*dy)/(dx*dx+dy*dy);
	var lineX=lerp(line.x0, line.x1, t);
	var lineY=lerp(line.y0, line.y1, t);
	return({x:lineX,y:lineY});
};

/**
 * 
 * @param p1 -point {x,y}
 * @param p2 -point {x,y}
 * @returns  -line {a,b} 
 */
 export function calcLine(p1, p2){
	var la = (p2.y-p1.y)/(p2.x-p1.x);
	var lb = p1.y - (la*p1.x);
	return {a:la, b:lb}
}

/**
 * Return perpendicular line to base line in some point
 * @param baseLine  - {a,b}
 * @param point - {x,y}
 */
//  export function calcPerpendicularLineInPoint(baseLine, point){ // NOT USED
// 	var la = -1/baseLine.a;
// 	var lb = point.y - la*point.x;
// 	return {a:la, b:lb};
// } 

export function calcPointOnPerpendicularLine(baseLine, point, distance){
	if(baseLine.a===0){//linia pozioma
		return {x:point.x, y:point.y+distance};
	}else if(!isFinite(baseLine.a)){ //linia pionowa
		return {x:point.x+distance, y:point.y}
	}else {
		var a = baseLine.a;
		var c = Math.sqrt(1+(1/a)*(1/a));
		var x = point.x + distance/c;
		var y = point.y - (distance/a)/c;
		return {x:x,y:y};
	}
}

/**
 * @param point {x,y}
 * @param line {a,b}
 */
 export function movePointByDistance(point,distance, byLine){
	if(byLine.a===0){//linia pozioma
		return {x:point.x+distance, y:point.y};
	}else if(!isFinite(byLine.a)){ //linia pionowa
		return {x:point.x, y:point.y+distance}
	}else {
		var r = Math.sqrt(1+byLine.a*byLine.a);
		var dx = distance/r;
		var dy = byLine.a*dx;
		var x = point.x+dx;
		var y = point.y+dy;
		return {x:x, y:y};
	}
}

/**
 * 
 * @param min 	-range min value
 * @param p 	- tested value
 * @param max 	- range max value
 * @param tolerance - hit tolerance (default 0)
 * @returns {Boolean}
 */
 export function between(min, p, max, tolerance){
	var t = 0;
	if(tolerance) t = tolerance;
	var result = false;

	if ( min <= max ){
		if ( p > min-t && p < max+t ){
			result = true;
		}
	}

	if ( min > max ){
		if ( p > max-t && p < min+t){
			result = true
		}
	}

	if ( p == min || p == max ){
		result = true;
	}

	return result;
}

export function findAnchorPointForXY(points, x,y,tolerance){
	var result = null;
	points.forEach(function(p){
		if(isPointInCircle({x:x, y:y, r:tolerance},p.x,p.y)){
			result = p;
		}	
	})
	return result;
}

export function findAnchorPointArrowForXY(points, x,y,distance,tolerance){
	var result = null;
	points.forEach(function(p){
		if(p.expandable && isPointInCircle({x:x, y:y, r:tolerance},p.x,p.y+distance)){
			result = p;
		}	
	})
	return result;
}

export function drawAnchor(ctx, panel, point, radius, color, alpha) {
	if(	between(0, point.x, panel._width) && 
			between(panel._offset, point.y, panel._offset+panel._height)){
		ctx.fillStyle = color;
		ctx.globalAlpha = alpha;
		ctx.beginPath();
		ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);
		ctx.fill();
		ctx.closePath();
		ctx.globalAlpha = 1;
	}
}

export function drawAnchors(ctx, panel, points, radius, color, alpha ) {
	for(var i =0; i< points.length; i++){
		if(	between(0, points[i].x, panel._width) && 
				between(panel._offset, points[i].y, panel._offset+panel._height)){

			ctx.fillStyle = color;
			ctx.globalAlpha = alpha;
			ctx.beginPath();
			ctx.arc(points[i].x, points[i].y, radius, 0, 2 * Math.PI, false);
			ctx.fill();
			ctx.closePath();
			ctx.globalAlpha = 1;
		}
	}
}

export function drawAnchorArrow(ctx, panel, point, size, distance, color, alpha ) {
	//leftOrRight >0 right, <0 left
	var d = (point.dir ==='left' ? -1 : 1);
	if(point.expanded == true) d = -d;
	
	var x = point.x;
	var y = point.y;
	
	ctx.globalAlpha = alpha;	
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(x-d*size/2,	y+distance-size/2);
	ctx.lineTo(x+d*size/2, 	y+distance);
	ctx.lineTo(x-d*size/2,	y+distance+size/2);
	ctx.lineTo(x-d*size/2,	y+distance-size/2);
	ctx.fill();
	ctx.globalAlpha = 1;
	ctx.closePath();
	//ctx.beginPath();
	//ctx.closePath();
}


export function drawAnchorsArrow(ctx, panel, points, size, distance, color, alpha ) {
	for(var i =0; i< points.length; i++){
		if(	between(0, points[i].x, panel._width) && 
				between(panel._offset, points[i].y, panel._offset+panel._height)){
			if(points[i].expandable)	
				drawAnchorArrow(ctx, panel, points[i], size, distance, color, alpha )
		}
	}
};

export function drawIndicatorMarker(ctx, panel, point, radius, color, alpha ) {
	var xOffset = radius;
	var yOffset = -radius-13;
	var x = point.x+xOffset;
	var y = point.y+yOffset;

	if(	between(0, x, panel._width) && 
			between(panel._offset, y, panel._offset+panel._height)){
		ctx.restore();
		ctx.fillStyle = color;
		ctx.globalAlpha = alpha;
		
		ctx.beginPath();
		ctx.arc(x, y, radius, 0.7*Math.PI , 2.5 * Math.PI);
		ctx.lineTo(x-radius,y+radius+11);
		ctx.closePath();
		ctx.fill();

 		ctx.beginPath();
 		ctx.strokeStyle = 'white';
 		
 		ctx.moveTo(x - 6.5,	y + 3.5);
 		ctx.lineTo(x - 4.5, y - 2.5);
 		ctx.lineTo(x - 1.5, y + 6.5);
 		ctx.lineTo(x + 1.5, y - 5.5);
 		ctx.lineTo(x + 3.5,	y + 0.5);
 		ctx.lineTo(x + 5.5,	y - 5.5);
 		
// 		ctx.lineTo(75,60);
// 		ctx.lineTo(90,85);
// 		ctx.lineTo(95,45);
// 		ctx.lineTo(100,60);

		ctx.stroke();
		ctx.closePath();
		
		ctx.globalAlpha = 1;
	}

}

export function renderPriceText(text, ctx, x, y) {
	ctx.font = WEBRCP.utils.colorManager.getFont("price");

	if (text >= 0.0001) {
		ctx.fillText(text, x, y);
		return;
	}

	const magnitude = LIB.getNumberMagnitude(text);
	let currentText = "0.(0";
	ctx.fillText(currentText, x, y);
	console.log(currentText);
	let currentX = x + ctx.measureText(currentText).width + 1;

	ctx.font = WEBRCP.utils.colorManager.getFont("priceSubscript");
	ctx.fillText(magnitude, currentX, y + 2);
	console.log(currentText);
	currentX += ctx.measureText(magnitude).width + 1;
	ctx.font = WEBRCP.utils.colorManager.getFont("price");
	currentText = ")" + text.substring(magnitude + 2);
	ctx.fillText(currentText, currentX, y);
	console.log(currentText);
}

export function measurePriceTextWidth(text, ctx) {
	if (text >= 0.0001) {
		return ctx.measureText(text).width;
	}

	ctx.font = WEBRCP.utils.colorManager.getFont("price");
	const magnitude = LIB.getNumberMagnitude(text);
	let currentText = "0.(0";

	let width = ctx.measureText(currentText).width + 1;

	ctx.font = WEBRCP.utils.colorManager.getFont("priceSubscript");
	width += ctx.measureText(magnitude).width + 1;
	ctx.font = WEBRCP.utils.colorManager.getFont("price");
	currentText = ")" + text.substring(magnitude + 2);
	width += ctx.measureText(currentText).width;

	return width;
}

//# sourceURL=./platform/components/newchart/js/objects-lib.js