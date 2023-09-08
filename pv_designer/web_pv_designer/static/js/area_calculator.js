var shapesData = [];
var panelWidth = 1.1;
var panelHeight = 2.1;
var panelWidthRotated = 0;
var panelHeightRotated = 0;
let pvPanelUrl;

function calculateArea() {
    clearSelection();
    clearMarkers();
    let i = 0;
    let panelsCount = 0;
    console.log(shapes);
    shapesData = [];
    shapes.forEach(function (shape, index) {
        i++;
        panelsCount = fillPolygon(index);
        const area = google.maps.geometry.spherical.computeArea(shape.getPath());
        const shapeData = {'type': 'polygon', 'area': area, 'panelsCount': panelsCount};
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
    const cornerPoints = findPolygonCorners(shapes[index].getPath().getArray(), true);
    shapes[index].setPath([cornerPoints.leftTop, cornerPoints.rightTop, cornerPoints.rightBottom, cornerPoints.leftBottom]);
    let polygon = shapes[index];

    let headingLTR = google.maps.geometry.spherical.computeHeading(cornerPoints.leftTop, cornerPoints.rightTop);
    const angle = 90 - headingLTR;
    pvPanelUrl = rotateImage(angle);
    cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, 50, headingLTR);
    let headingRTL = google.maps.geometry.spherical.computeHeading(cornerPoints.rightTop, cornerPoints.leftTop);
    cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, 50, headingRTL);
    console.log("headingLTR: " + headingLTR);
    console.log("headingRTL: " + headingRTL);

    const colsCount = Math.floor(google.maps.geometry.spherical.computeDistanceBetween(cornerPoints.leftTop, cornerPoints.rightTop) / panelWidth);
    let topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);

    let panelsCount = drawPoints(topPoints, polygon, false);
    for (let i = 0; i < 10; i++) {
        cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, panelHeight, headingLTR + 90);
        cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, panelHeight, headingRTL - 90);
        topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);
        if (panelsCount > 0) {
            panelsCount += drawPoints(topPoints, polygon, true);
        } else {
            panelsCount = drawPoints(topPoints, polygon, false);
        }

    }
    console.log(panelsCount);
    return panelsCount;
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

function drawPoints(points, polygon, notFirstLine = false) {
    const imgUrl = pvPanelUrl;
    console.log(imgUrl)
    let panelCount = 0;
    for (let i = 0; i < points.length; i++) {
        const leftTop = polygon.getPath().getAt(0);
        const panelWidthPix = calculatePixelSize(map, panelWidthRotated, leftTop.lat());
        const panelHeightPix = calculatePixelSize(map, panelHeightRotated, leftTop.lat());
        const picture = {
            url: imgUrl,
            scaledSize: new google.maps.Size(panelWidthPix, panelHeightPix),
            anchor: new google.maps.Point(0, 0)

        };
        if (isPanelInPolygon(points[i], polygon, notFirstLine)) {
            putMarker(points[i], picture);
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
    let offset = Math.abs(angle) / 100;
    let offsetHeight = offset;
    if (angle < 45 && angle > -45) {
        if (offset > 0.1) {
            offsetHeight -= 0.1;
        }
        panelWidthRotated = panelWidth + offset;
        panelHeightRotated = panelHeight + offsetHeight
    } else {
        offset = (90 - Math.abs(angle)) / 100;
        panelWidthRotated = panelHeight + offset;
        panelHeightRotated = panelWidth + offset
    }
    return getPvImgUrl();
}
