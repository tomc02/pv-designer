var shapesData = [];
var panelWidth = 1.15;
var panelHeight = 1.75;
var panelWidthRotated = 0;
var panelHeightRotated = 0;
var shapesFiled = [];

class areaData {
    constructor(panelsCount, azimuth) {
        this.panelsCount = panelsCount;
        this.azimuth = azimuth;
    }
}

function calculateArea() {
    clearSelection();
    clearMarkers();
    let i = 0;
    let panelsCount = 0;
    console.log(shapes);
    shapesData = [];
    shapes.forEach(function (shape, index) {
        i++;
        const polygon = fillPolygon(index);
        const area = google.maps.geometry.spherical.computeArea(shape.getPath());
        const shapeData = {
            'type': 'polygon',
            'area': area,
            'panelsCount': polygon.panelsCount,
            'azimuth': polygon.azimuth
        };
        shapesData.push(shapeData);
    });
    // lock map zoom
    map.setOptions({zoomControl: false, scrollwheel: false, disableDoubleClickZoom: true});
}

function rotatePolygon(polygon) {
    const cornerPoints = getCornerPoints(polygon);
    polygon.setPath([cornerPoints.rightTop, cornerPoints.rightBottom, cornerPoints.leftBottom, cornerPoints.leftTop]);
    return polygon;
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

function calculateSlopeDimensions(corners, slopeDegrees) {
    let leftTop;
    let rightTop;
    let leftBottom;
    let rightBottom;

    leftBottom = corners.leftBottom;
    rightBottom = corners.rightBottom;
    leftTop = corners.leftTop;
    rightTop = corners.rightTop;

    const topToBottomLeft = google.maps.geometry.spherical.computeDistanceBetween(leftTop, leftBottom);
    const topToBottomRight = google.maps.geometry.spherical.computeDistanceBetween(rightTop, rightBottom);
    slopeDegrees = 90 - slopeDegrees;
    const hypotenuseLeft = topToBottomLeft / Math.sin(slopeDegrees * Math.PI / 180);
    const hypotenuseRight = topToBottomRight / Math.sin(slopeDegrees * Math.PI / 180);

    leftBottom = google.maps.geometry.spherical.computeOffset(leftTop, hypotenuseLeft, google.maps.geometry.spherical.computeHeading(leftTop, leftBottom));
    rightBottom = google.maps.geometry.spherical.computeOffset(rightTop, hypotenuseRight, google.maps.geometry.spherical.computeHeading(rightTop, rightBottom));

    return {
        leftTop,
        rightTop,
        leftBottom,
        rightBottom,
    };
}
function recalculatePanelHeight(slopeDegrees ){
    slopeDegrees = 90- slopeDegrees;
    console.log('panelHeight: ' + panelHeight);
    let newH = panelHeight * Math.sin(slopeDegrees * Math.PI / 180);
    console.log('newH: ' + newH);
    panelHeight = newH;
}

function fillPolygon(index) {
    let cornerPoints;
    if (!shapesFiled.includes(index)) {
        cornerPoints = sortCorners(shapes[index].getPath().getArray());
        //cornerPoints = calculateSlopeDimensions(cornerPoints, 55);
        shapesFiled.push(index);
    } else {
        cornerPoints = getCornerPoints(shapes[index]);
    }
    recalculatePanelHeight(55);

    shapes[index].setPath([cornerPoints.leftTop, cornerPoints.rightTop, cornerPoints.rightBottom, cornerPoints.leftBottom]);
    let polygon = shapes[index];
    let headingLTR = google.maps.geometry.spherical.computeHeading(cornerPoints.leftTop, cornerPoints.rightTop);
    let headingRTL = google.maps.geometry.spherical.computeHeading(cornerPoints.rightTop, cornerPoints.leftTop);
    const angle = 90 - headingLTR;
    const pvPanelUrl = rotateImage(angle);
    console.log('url: ' + pvPanelUrl);
    cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, 50, headingLTR);
    cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, 50, headingRTL);
    let azimuth = Math.floor((180 - (headingLTR + 90)) * -1);
    console.log('azimuth: ' + azimuth)
    const headingRTD = headingLTR + 90;

    const colsCount = Math.floor(google.maps.geometry.spherical.computeDistanceBetween(cornerPoints.leftTop, cornerPoints.rightTop) / panelWidth);
    let topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);
    let panelsCount = drawPoints(topPoints, polygon, false, headingLTR, headingRTD, pvPanelUrl, index);
    for (let i = 0; i < 10; i++) {
        cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, panelHeight, headingLTR + 90);
        cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, panelHeight, headingRTL - 90);
        console.log('azimuth: ' + azimuth)
        topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);
        if (panelsCount > 0) {
            panelsCount += drawPoints(topPoints, polygon, true, headingLTR, headingRTD, pvPanelUrl, index);
        } else {
            panelsCount = drawPoints(topPoints, polygon, false, headingLTR, headingRTD, pvPanelUrl, index);
        }

    }
    return new areaData(panelsCount, azimuth);
}

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
    const angle = 90 - headingLTR;
    const picture = getMarkerPicture(leftTop, pvPanelUrl, angle);
    for (let i = 0; i < points.length; i++) {
        if (isPanelInPolygon(points[i], polygon, notFirstLine, headingLTR, headingRTD)) {
            putMarker(points[i], picture, angle, polygonIndex);
            panelCount++;
        }
    }
    return panelCount;
}

function calculatePixelSize(map, meters, latitude) {
    const metersPerPixel = (40075000 * Math.cos(latitude * Math.PI / 180)) / (256 * Math.pow(2, map.getZoom()));
    return meters / metersPerPixel;
}

function rotateImage(angle) {
    console.log(angle)
    $.ajax({
        url: rotateImgUrl,
        data: {'angle': angle},
    });
    return getPvImgUrl(angle);
}
