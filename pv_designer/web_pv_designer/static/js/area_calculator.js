var shapesData = [];
function calculateArea() {
    let area_string = "Plocha:" + '<br>';
    let sum = 0;
    let i = 0;
    console.log(shapes[0]);
    shapes.forEach(function (shape) {
        i++;
        if (shape instanceof google.maps.Polygon) {
            const panelsCount = fillPolygon(shape)
            var area = google.maps.geometry.spherical.computeArea(shape.getPath());
            area_string += i + ': ' + area.toFixed(2) + " m^2" + '<br>';
            sum += area;
            const shapeData = {'type': 'polygon', 'area': area, 'panelsCount': panelsCount};
            shapesData.push(shapeData);
        }
    });
    document.getElementById("areaDisplay").innerHTML = area_string + "<br> Celkova plocha: " + sum.toFixed(2) + " m^2";
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

function fillPolygon(polygon) {
    const cornerPoints = findPolygonCorners(polygon.getPath().getArray(), true);
    let rotatedPolygon = new google.maps.Polygon({
        paths: [cornerPoints.leftTop, cornerPoints.rightTop, cornerPoints.rightBottom, cornerPoints.leftBottom],

    });
    let heading = google.maps.geometry.spherical.computeHeading(cornerPoints.leftTop, cornerPoints.rightTop);
    cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, 50, heading);
    heading = google.maps.geometry.spherical.computeHeading(cornerPoints.rightTop, cornerPoints.leftTop);
    cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, 50, heading);

    var colsCount = Math.floor(google.maps.geometry.spherical.computeDistanceBetween(cornerPoints.leftTop, cornerPoints.rightTop) / panelWidth);
    var topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);

    rotateImage(0)
    let panelsCount =  drawPoints(topPoints, rotatedPolygon);
    for (var i = 0; i < 10; i++) {
        cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, panelHeight, 180);
        cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, panelHeight, 180);
        topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);
        panelsCount += drawPoints(topPoints, rotatedPolygon);
    }
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

function drawPoints(points, polygon) {
    let panelCount = 0;
    for (let i = 0; i < points.length; i++) {
        const leftTop = polygon.getPath().getAt(0);
        const panelWidthPix = calculatePixelSize(map, panelWidth, leftTop.lat());
        const panelHeightPix = calculatePixelSize(map, panelHeight, leftTop.lat());
        const picture = {
            url: pvPanelImg,
            scaledSize: new google.maps.Size(panelWidthPix, panelHeightPix),
            anchor: new google.maps.Point(0, 5)

        };
        const intersect = google.maps.geometry.poly.containsLocation(points[i], polygon);
        if (intersect) {
            const marker = new google.maps.Marker({
                position: points[i], map: map, icon: picture, title: 'Panel position'
            });
            markers.push(marker);
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
    $.ajax({
        url: rotateImgUrl,
        data: {'angle': angle},
    });
}