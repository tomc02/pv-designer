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

function rotateTriangle(shape) {
    const cornerPoints = getCornerPoints(shape.getShape());
    shape.setPath([cornerPoints.rightTop, cornerPoints.bottom, cornerPoints.leftTop]);
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
    if (polugon.getPath().getLength() === 3) {
        return {
            leftTop: polugon.getPath().getAt(0),
            rightTop: polugon.getPath().getAt(1),
            bottom: polugon.getPath().getAt(2),
        }
    }
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

function setListenerForShapeDragging(shape) {
    google.maps.event.addListener(shape.getShape(), 'dragstart', function () {
        shape.dragging = true;
    });
    google.maps.event.addListener(shape.getShape(), 'dragend', function () {
        shapesHandler.fillAreaWithPanels();
        shape.dragging = false;
    });
    shape.listenerSet = true;
}

function setListenerForShapeChange(shape) {
    google.maps.event.addListener(shape.getPath(), 'set_at', function () {
        shapesHandler.selectedShape.updateHighlightedEdge();
        if (!shape.dragging) {
            shapesHandler.fillAreaWithPanels();
        }
    });
}

function getHeadings(corners) {
    const gMaps = google.maps.geometry.spherical;
    return {
        headingLTR: gMaps.computeHeading(corners.leftTop, corners.rightTop),
        headingRTL: gMaps.computeHeading(corners.rightTop, corners.leftTop),
        headingLTD: gMaps.computeHeading(corners.leftTop, corners.leftBottom),
        headingRTD: gMaps.computeHeading(corners.rightTop, corners.rightBottom),
    }
}

function computeAzimuth(headingLTR) {
    function modulo(n, m) {
        return ((n % m) + m) % m;
    }
    let azimuth = modulo(headingLTR - 90 + 180, 360) - 180;
    return Math.round(azimuth);
}

function computeHypotenuse(heading1, heading2, panelHeight) {
    let angle = calculateAngle(heading1, heading2);
    angle = Math.abs(angle - 90);
    return panelHeight / Math.cos(angle * Math.PI / 180);
}

function fillPolygon(index) {
    const gMaps = google.maps.geometry;
    let cornerPoints;
    if (!shapesFiled.includes(index)) {
        console.log('Sorting corners');
        cornerPoints = sortCorners(shapesHandler.getShape(index).getPath().getArray());
        shapesFiled.push(index);
    } else {
        cornerPoints = getCornerPoints(shapesHandler.getShape(index));
    }
    shapesHandler.recalculatePanelHeight(index, shapesHandler.getShapeObject(index).getSlope());

    shapesHandler.setPath(index, [cornerPoints.leftTop, cornerPoints.rightTop, cornerPoints.rightBottom, cornerPoints.leftBottom]);

    const shape = shapesHandler.getShapeObject(index);
    if (!shape.listenerSet) {
        setListenerForShapeDragging(shape);
    }
    setListenerForShapeChange(shape);
    addInsertPointListener(shape);
    shapesHandler.selectedShape.updateHighlightedEdge();


    let polygon = shapesHandler.getShape(index);
    let {headingLTR, headingRTL, headingLTD, headingRTD} = getHeadings(cornerPoints);

    const hypotenuseLTR_LTD = computeHypotenuse(headingLTR, headingLTD, shapesHandler.getPanelHeight(index));
    const hypotenuseRTL_RTD = computeHypotenuse(headingRTL, headingRTD, shapesHandler.getPanelHeight(index));

    let angle = 90 - headingLTR;
    const pvPanelUrl = rotateImage(angle, shapesHandler.getShapeObject(index).getSlope(), shape.orientation);
    console.log('pvPanelUrl', pvPanelUrl);
    let azimuth = computeAzimuth(headingLTR);

    let topPoints = [];
    let panelsCount = 0;
    let iteration = 0;
    let continuePlacingPanels = true;

    console.log('HeadingLTR:', headingLTR);
    while (continuePlacingPanels && iteration < 100) {
        if (headingLTR > 0 || (headingLTR < -90 && headingLTR > -120)) {
            topPoints = generatePanels(cornerPoints.leftTop, cornerPoints.rightTop, shapesHandler.getPanelWidth(index), headingLTR);
        } else {
            topPoints = generatePanels(cornerPoints.rightTop, cornerPoints.leftTop, shapesHandler.getPanelWidth(index), headingRTL);
        }
        // move corner points
        cornerPoints.leftTop = gMaps.spherical.computeOffset(cornerPoints.leftTop, hypotenuseLTR_LTD, headingLTD);
        cornerPoints.rightTop = gMaps.spherical.computeOffset(cornerPoints.rightTop, hypotenuseRTL_RTD, headingRTD);

        continuePlacingPanels = gMaps.poly.containsLocation(cornerPoints.leftTop, polygon) || gMaps.poly.containsLocation(cornerPoints.rightTop, polygon);

        if (continuePlacingPanels) {
            panelsCount += drawPoints(topPoints, polygon, angle, pvPanelUrl, index);
        }

        iteration++;
    }
    return new areaData(panelsCount, azimuth);
}


function fillTriangle(index) {
    const gMaps = google.maps.geometry;
    let cornerPoints = getCornerPoints(shapesHandler.getShape(index));
    shapesHandler.recalculatePanelHeight(index, shapesHandler.getShapeObject(index).getSlope());
    shapesHandler.setPath(index, [cornerPoints.leftTop, cornerPoints.rightTop, cornerPoints.bottom]);

    const shape = shapesHandler.getShapeObject(index);
    if (!shape.listenerSet) {
        setListenerForShapeDragging(shape);
    }
    setListenerForShapeChange(shape);
    addInsertPointListener(shape);
    shapesHandler.selectedShape.updateHighlightedEdge();


    let polygon = shapesHandler.getShape(index);
    let headingLTR = gMaps.spherical.computeHeading(cornerPoints.leftTop, cornerPoints.rightTop);
    let headingLTD = gMaps.spherical.computeHeading(cornerPoints.leftTop, cornerPoints.bottom);
    let headingRTL = gMaps.spherical.computeHeading(cornerPoints.rightTop, cornerPoints.leftTop);
    let headingRTD = gMaps.spherical.computeHeading(cornerPoints.rightTop, cornerPoints.bottom);

    const hypotenuseLTR_LTD = computeHypotenuse(headingLTR, headingLTD, shapesHandler.getPanelHeight(index));
    const hypotenuseRTL_RTD = computeHypotenuse(headingRTL, headingRTD, shapesHandler.getPanelHeight(index));

    let angle = 90 - headingLTR;
    const pvPanelUrl = rotateImage(angle, shapesHandler.getShapeObject(index).getSlope(), shape.orientation);
    let azimuth = computeAzimuth(headingLTR);

    let topPoints = [];
    let panelsCount = 0;
    let iteration = 0;
    let continuePlacingPanels = true;

    while (continuePlacingPanels && iteration < 100) {
        if (headingLTR > 0 || (headingLTR < -90 && headingLTR > -160)) {
            topPoints = generatePanels(cornerPoints.leftTop, cornerPoints.rightTop, shapesHandler.getPanelWidth(index), headingLTR);
        } else {
            topPoints = generatePanels(cornerPoints.rightTop, cornerPoints.leftTop, shapesHandler.getPanelWidth(index), headingRTL);
        }
        // move corner points
        cornerPoints.leftTop = gMaps.spherical.computeOffset(cornerPoints.leftTop, hypotenuseLTR_LTD, headingLTD);
        cornerPoints.rightTop = gMaps.spherical.computeOffset(cornerPoints.rightTop, hypotenuseRTL_RTD, headingRTD);

        continuePlacingPanels = gMaps.poly.containsLocation(cornerPoints.leftTop, polygon) || gMaps.poly.containsLocation(cornerPoints.rightTop, polygon);

        if (continuePlacingPanels) {
            panelsCount += drawPoints(topPoints, polygon, angle, pvPanelUrl, index);
        }
        iteration++;
    }
    return new areaData(panelsCount, azimuth);
}

function generatePanels(startPoint, endPoint, panelWidth, heading) {
    const panels = [];
    let position = startPoint;
    let index = 0;
    const gMaps = google.maps.geometry.spherical;
    while (gMaps.computeDistanceBetween(position, endPoint) >= panelWidth) {
        panels.push(position);
        position = gMaps.computeOffset(position, panelWidth, heading);
        index++;
        if (index > 100) { // maximum panels in one row
            break;
        }
    }
    return panels;
}

function drawPoints(points, polygon, angle, pvPanelUrl, polygonIndex) {
    let panelCount = 0;
    const leftTop = polygon.getPath().getAt(0);
    const picture = markerHandler.getMarkerPicture(leftTop, pvPanelUrl, angle, polygonIndex);
    for (let i = 0; i < points.length; i++) {
        const leftTop = points[i];
        if (google.maps.geometry.poly.containsLocation(leftTop, polygon)) {
            markerHandler.putMarker(points[i], picture, angle, polygonIndex);
            panelCount++;
        }
    }
    return panelCount;
}

function calculatePixelSize(map, meters, latitude) {
    zoom = map.getZoom();
    var earthRadius = 6378137;
    var latRadians = latitude * (Math.PI / 180);
    var metersPerPixel = (Math.cos(latRadians) * 2 * Math.PI * earthRadius) / (256 * Math.pow(2, zoom));
    var pixelSize = meters / metersPerPixel;
    return pixelSize;
}

function rotateImage(angle, slope, orientation) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", rotateImgUrl + "?angle=" + angle + "&slope=" + slope + "&orientation=" + orientation, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                // Request successful
            } else {
                console.error("Request failed with status:", xhr.status);
            }
        }
    };
    xhr.send();
    return getPvImgUrl(angle);
}

