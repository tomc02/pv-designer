var shapesData = [];
var panelWidth = 1.15;
var panelHeight = 1.75;
var panelWidthRotated = 0;
var panelHeightRotated = 0;

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

function findPolygonCorners(points, rotate) {
    let leftTop, leftBottom, rightTop, rightBottom;
    if (rotate) {
        points.sort(function (a, b) {
            return a.lng() - b.lng();
        });
        if (points[0].lat() > points[1].lat()) {
            leftTop = points[0];
            leftBottom = points[1];
        } else {
            leftTop = points[1];
            leftBottom = points[0];
        }
        if (points[2].lat() > points[3].lat()) {
            rightTop = points[2];
            rightBottom = points[3];
        } else {
            rightTop = points[3];
            rightBottom = points[2];
        }
    } else {
        leftTop = points[0];
        rightTop = points[1];
        rightBottom = points[2];
        leftBottom = points[3];
    }
    return {
        leftTop: leftTop, rightTop: rightTop, leftBottom: leftBottom, rightBottom: rightBottom
    };
}

function rotatePolygon(polygon) {
    // rotate polygon
    const cornerPoints = findPolygonCorners(polygon.getPath().getArray(), false);
    console.log("rotatePolygon");
    polygon.setPath([cornerPoints.rightTop, cornerPoints.rightBottom, cornerPoints.leftBottom, cornerPoints.leftTop]);
    return polygon;
}

function fillPolygon(index) {
    const cornerPoints = findPolygonCorners(shapes[index].getPath().getArray(), false);
    shapes[index].setPath([cornerPoints.leftTop, cornerPoints.rightTop, cornerPoints.rightBottom, cornerPoints.leftBottom]);
    let polygon = shapes[index];

    let headingLTR = google.maps.geometry.spherical.computeHeading(cornerPoints.leftTop, cornerPoints.rightTop);
    const angle = 90 - headingLTR;
    const pvPanelUrl = rotateImage(angle);
    console.log('url: ' + pvPanelUrl);
    cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, 50, headingLTR);
    let headingRTL = google.maps.geometry.spherical.computeHeading(cornerPoints.rightTop, cornerPoints.leftTop);
    cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, 50, headingRTL);
    let azimuth = Math.floor((180 - (headingLTR + 90)) * -1);
    console.log('azimuth: ' + azimuth)
    const headingRTD = headingLTR + 90;

    const colsCount = Math.floor(google.maps.geometry.spherical.computeDistanceBetween(cornerPoints.leftTop, cornerPoints.rightTop) / panelWidth);
    let topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);
    let panelsCount = drawPoints(topPoints, polygon, false, headingLTR, headingRTD, pvPanelUrl);
    for (let i = 0; i < 10; i++) {
        cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, panelHeight, headingLTR + 90);
        cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, panelHeight, headingRTL - 90);
        console.log('azimuth: ' + azimuth)
        topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);
        if (panelsCount > 0) {
            panelsCount += drawPoints(topPoints, polygon, true, headingLTR, headingRTD, pvPanelUrl);
        } else {
            panelsCount = drawPoints(topPoints, polygon, false, headingLTR, headingRTD, pvPanelUrl);
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

function drawPoints(points, polygon, notFirstLine = false, headingLTR, headingRTD, pvPanelUrl){
    let panelCount = 0;
    const leftTop = polygon.getPath().getAt(0);
    const angle = 90 - headingLTR;
    const picture = getMarkerPicture(leftTop,pvPanelUrl, angle);
    for (let i = 0; i < points.length; i++) {
        if (isPanelInPolygon(points[i], polygon, notFirstLine, headingLTR, headingRTD)) {
            putMarker(points[i], picture, angle);
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
