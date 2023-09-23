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

function analyzePolygonPoints(polygon) {
    const polygonCoords = polygon.getPath().getArray();

    let centroidLat = 0;
    let centroidLng = 0;
    for (let i = 0; i < polygonCoords.length; i++) {
        centroidLat += polygonCoords[i].lat();
        centroidLng += polygonCoords[i].lng();
    }
    centroidLat /= polygonCoords.length;
    centroidLng /= polygonCoords.length;

    let leftTop = polygonCoords[0];
    let rightTop = polygonCoords[0];
    let leftBottom = polygonCoords[0];
    let rightBottom = polygonCoords[0];

    for (let i = 1; i < polygonCoords.length; i++) {
        const point = polygonCoords[i];

        if (point.lat() > centroidLat && point.lng() < centroidLng) {
            leftTop = point;
        } else if (point.lat() > centroidLat && point.lng() > centroidLng) {
            rightTop = point;
        } else if (point.lat() < centroidLat && point.lng() < centroidLng) {
            leftBottom = point;
        } else if (point.lat() < centroidLat && point.lng() > centroidLng) {
            rightBottom = point;
        }
    }
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

function fillPolygon(index) {
    let cornerPoints;
    if (!shapesFiled.includes(index)) {
        cornerPoints = analyzePolygonPoints(shapes[index]);
        shapesFiled.push(index);
    } else {
        cornerPoints = getCornerPoints(shapes[index]);
    }

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
