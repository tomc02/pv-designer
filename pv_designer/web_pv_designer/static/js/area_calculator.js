var shapesData = [];
var shapesFiled = [];

class areaData {
    constructor(panelsCount, azimuth) {
        this.panelsCount = panelsCount;
        this.azimuth = azimuth;
    }
}

function rotatePolygon(shape) {
    const cornerPoints = getCornerPoints(shape.getShape());
    shape.setPath([cornerPoints.rightTop, cornerPoints.rightBottom, cornerPoints.leftBottom, cornerPoints.leftTop]);
}

function sortCorners(corners) {
    if (corners.length !== 4) {
        console.error('Expected exactly 4 corners');
        return;
    }
    let leftTop;
    let rightTop;
    let leftBottom;
    let rightBottom;

    corners.sort((a, b) => a.lat() - b.lat()); // Sort by latitude

    const bottomCorners = corners.slice(0, 2).sort((a, b) => a.lng() - b.lng());
    const topCorners = corners.slice(2).sort((a, b) => a.lng() - b.lng());

    leftBottom = bottomCorners[0];
    rightBottom = bottomCorners[1];
    leftTop = topCorners[0];
    rightTop = topCorners[1];

    return {
        leftTop,
        rightTop,
        leftBottom,
        rightBottom,
    };
}

function getCornerPoints(polugon) {
    return {
        leftTop: polugon.getPath().getAt(0),
        rightTop: polugon.getPath().getAt(1),
        rightBottom: polugon.getPath().getAt(2),
        leftBottom: polugon.getPath().getAt(3),
    }
}

function calculateAngle(heading1, heading2) {
    let angle = Math.abs(heading1 - heading2);
    angle = Math.min(angle, 360 - angle);
    return angle;
}

function setListenerForShapeChange(shape) {
    google.maps.event.addListener(shape.getShape(), 'dragstart', function () {
        shape.dragging = true;
    });
    google.maps.event.addListener(shape.getShape(), 'dragend', function () {
        shapesHandler.fillAreaWithPanels();
        shape.dragging = false;
    });
    shape.listenerSet = true;
}

function fillPolygon(index) {
    let cornerPoints;
    if (!shapesFiled.includes(index)) {
        cornerPoints = sortCorners(shapesHandler.getShape(index).getPath().getArray());
        shapesFiled.push(index);
    } else {
    cornerPoints = getCornerPoints(shapesHandler.getShape(index));
    }
    shapesHandler.recalculatePanelHeight(index, shapesHandler.getShapeObject(index).getSlope());

    shapesHandler.setPath(index, [cornerPoints.leftTop, cornerPoints.rightTop, cornerPoints.rightBottom, cornerPoints.leftBottom]);

    const shape = shapesHandler.getShapeObject(index);
    if (!shape.listenerSet) {
        setListenerForShapeChange(shape);
    }
    google.maps.event.addListener(shape.getPath(), 'set_at', function () {
        shapesHandler.selectedShape.updateHighlightedEdge();
        if (!shape.dragging) {
            shapesHandler.fillAreaWithPanels();
        }
    });
    shapesHandler.selectedShape.updateHighlightedEdge();

    let polygon = shapesHandler.getShape(index);
    let headingLTR = google.maps.geometry.spherical.computeHeading(cornerPoints.leftTop, cornerPoints.rightTop);
    let headingRTL = google.maps.geometry.spherical.computeHeading(cornerPoints.rightTop, cornerPoints.leftTop);
    let headingLTD = google.maps.geometry.spherical.computeHeading(cornerPoints.leftTop, cornerPoints.leftBottom);
    let headingRTD = google.maps.geometry.spherical.computeHeading(cornerPoints.rightTop, cornerPoints.rightBottom);

    let angleLTR_LTD = calculateAngle(headingLTR, headingLTD);
    angleLTR_LTD = Math.abs(angleLTR_LTD - 90);

    let angleRTL_RTD = calculateAngle(headingRTL, headingRTD);
    angleRTL_RTD = Math.abs(angleRTL_RTD - 90);

    const hypotenuseLTR_LTD = shapesHandler.getPanelHeight(index) / Math.cos(angleLTR_LTD * Math.PI / 180);
    const hypotenuseRTL_RTD = shapesHandler.getPanelHeight(index) / Math.cos(angleRTL_RTD * Math.PI / 180);


    let angle = 90 - headingLTR;
    angle = angle > 180 ? angle - 180 : angle;
    const pvPanelUrl = rotateImage(angle, shapesHandler.getShapeObject(index).getSlope());
    console.log('url: ' + pvPanelUrl);

    let azimuth = 0;
    if (headingLTR < -90) {
        azimuth = 90 + 180 + headingLTR;
    }else{
        azimuth = headingLTR-90;
    }
    azimuth = Math.round(azimuth);

    let topPoints = [];
    let panelsCount = 0;
    for (let i = 0; i < 10; i++) {
        const colsCount = Math.floor(google.maps.geometry.spherical.computeDistanceBetween(cornerPoints.leftTop, cornerPoints.rightTop) / shapesHandler.getPanelWidth(index));
        topPoints = generatePointsBetween(cornerPoints.rightTop, cornerPoints.leftTop, colsCount);
        // move corner points
        cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, hypotenuseLTR_LTD, headingLTD);
        cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, hypotenuseRTL_RTD, headingRTD);
        if (panelsCount > 0) {
            panelsCount += drawPoints(topPoints, polygon, true, headingLTR, headingRTD, pvPanelUrl, index);
        } else {
            panelsCount = drawPoints(topPoints, polygon, false, headingLTR, headingRTD, pvPanelUrl, index);
        }
    }
    return new areaData(panelsCount, azimuth);
}

/*
function fillPolygon2(index) {
    let cornerPoints;
    if (!shapesFiled.includes(index)) {
        cornerPoints = sortCorners(shapesHandler.getShape(index).getPath().getArray());
        shapesFiled.push(index);
    } else {
        cornerPoints = getCornerPoints(shapesHandler.getShape(index));
    }
    shapesHandler.recalculatePanelHeight(index, shapesHandler.getShapeObject(index).getSlope());

    shapesHandler.setPath(index, [cornerPoints.leftTop, cornerPoints.rightTop, cornerPoints.rightBottom, cornerPoints.leftBottom]);
    let polygon = shapesHandler.getShape(index);
    let headingLTR = google.maps.geometry.spherical.computeHeading(cornerPoints.leftTop, cornerPoints.rightTop);
    let headingRTL = google.maps.geometry.spherical.computeHeading(cornerPoints.rightTop, cornerPoints.leftTop);
    let headingRTD2 = google.maps.geometry.spherical.computeHeading(cornerPoints.rightTop, cornerPoints.rightBottom);
    console.warn('headingLTR: ' + headingLTR);
    console.warn('headingRTL: ' + headingRTL);
    console.warn('headingRTD2: ' + headingRTD2);
    const angle = 90 - headingLTR;
    const pvPanelUrl = rotateImage(angle, shapesHandler.getShapeObject(index).getSlope());
    console.log('url: ' + pvPanelUrl);
    cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, 50, headingLTR);
    cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, 50, headingRTL);
    let azimuth = Math.floor((180 - (headingLTR + 90)) * -1);
    const headingRTD = headingLTR + 90;
    console.warn('headingRTD: ' + headingRTD);

    const colsCount = Math.floor(google.maps.geometry.spherical.computeDistanceBetween(cornerPoints.leftTop, cornerPoints.rightTop) / shapesHandler.getPanelWidth(index));
    let topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);
    let panelsCount = drawPoints(topPoints, polygon, false, headingLTR, headingRTD2, pvPanelUrl, index);
    for (let i = 0; i < 10; i++) {
        cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, shapesHandler.getPanelHeight(index), headingLTR + 90);
        cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, shapesHandler.getPanelHeight(index), headingRTL - 90);
        topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);
        if (panelsCount > 0) {
            panelsCount += drawPoints(topPoints, polygon, true, headingLTR, headingRTD2, pvPanelUrl, index);
        } else {
            panelsCount = drawPoints(topPoints, polygon, false, headingLTR, headingRTD2, pvPanelUrl, index);
        }

    }
    return new areaData(panelsCount, azimuth);
}
*/
function generatePointsBetween(startPoint, endPoint, numPoints) {
    const points = [];
    for (let i = 1; i < numPoints; i++) {
        const fraction = i / numPoints;
        const lat = startPoint.lat() + fraction * (endPoint.lat() - startPoint.lat());
        const lng = startPoint.lng() + fraction * (endPoint.lng() - startPoint.lng());
        points.push(new google.maps.LatLng(lat, lng));
    }
    return points;
}

function drawPoints(points, polygon, notFirstLine = false, headingLTR, headingRTD, pvPanelUrl, polygonIndex) {
    let panelCount = 0;
    const leftTop = polygon.getPath().getAt(0);
    let angle = 90 - headingLTR;
    // recalculate angle to range 0-180
    const picture = markerHandler.getMarkerPicture(leftTop, pvPanelUrl, angle, polygonIndex);
    //angle = angle > 180 ? angle - 180 : angle;
    for (let i = 0; i < points.length; i++) {
        const leftTop = points[i];
        if (isPanelInPolygon(points[i], polygon, notFirstLine, headingLTR, headingRTD)) {
            markerHandler.putMarker(points[i], picture, angle, polygonIndex);
            panelCount++;
        }
    }
    return panelCount;
}

function calculatePixelSize(map, meters, latitude) {
    const metersPerPixel = (40075000 * Math.cos(latitude * Math.PI / 180)) / (256 * Math.pow(2, map.getZoom()));
    return meters / metersPerPixel;
}

function rotateImage(angle, slope) {
    console.log(angle)
    $.ajax({
        url: rotateImgUrl,
        data: {
            'angle': angle,
            'slope': slope
        },
    });
    return getPvImgUrl(angle);
}
