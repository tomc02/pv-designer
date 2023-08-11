var shapesData = [];
function calculateArea() {
    clearSelection();
    markers.forEach(function (marker) {
        marker.setMap(null);
    });
    markers = [];
    let area_string = "Plocha:" + '<br>';
    let sum = 0;
    let i = 0;
    let panelsCount = 0;
    console.log(shapes);
    shapes.forEach(function (shape, index) {
        i++;
        if (shape instanceof google.maps.Polygon) {
            panelsCount = fillPolygon(shape, index);
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

function fillPolygon(polygon, index) {
    const cornerPoints = findPolygonCorners(shapes[index].getPath().getArray(), true);
    shapes[index].setPath([cornerPoints.leftTop, cornerPoints.rightTop, cornerPoints.rightBottom, cornerPoints.leftBottom]);
    polygon = shapes[index];

    let heading = google.maps.geometry.spherical.computeHeading(cornerPoints.leftTop, cornerPoints.rightTop);
    cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, 50, heading);
    heading = google.maps.geometry.spherical.computeHeading(cornerPoints.rightTop, cornerPoints.leftTop);
    cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, 50, heading);

    var colsCount = Math.floor(google.maps.geometry.spherical.computeDistanceBetween(cornerPoints.leftTop, cornerPoints.rightTop) / panelWidth);
    var topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);

    rotateImage(0)
    let panelsCount =  drawPoints(topPoints, polygon);
    for (var i = 0; i < 10; i++) {
        cornerPoints.leftTop = google.maps.geometry.spherical.computeOffset(cornerPoints.leftTop, panelHeight, 180);
        cornerPoints.rightTop = google.maps.geometry.spherical.computeOffset(cornerPoints.rightTop, panelHeight, 180);
        topPoints = generatePointsBetween(cornerPoints.leftTop, cornerPoints.rightTop, colsCount);
        if(panelsCount > 0){
            panelsCount += drawPoints(topPoints, polygon, true);
        } else{
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
    let panelCount = 0;
    for (let i = 0; i < points.length; i++) {
        const leftTop = polygon.getPath().getAt(0);
        const panelWidthPix = calculatePixelSize(map, panelWidth, leftTop.lat());
        const panelHeightPix = calculatePixelSize(map, panelHeight, leftTop.lat());
        const picture = {
            url: pvPanelImg,
            scaledSize: new google.maps.Size(panelWidthPix, panelHeightPix),
            anchor: new google.maps.Point(0, 0)

        };
        let panelLeftTop = points[i];
        let panelRightTop = google.maps.geometry.spherical.computeOffset(panelLeftTop, panelWidth, 90);
        let panelRightBottom = google.maps.geometry.spherical.computeOffset(panelRightTop, panelHeight, 180);
        let isLeftTop = google.maps.geometry.poly.containsLocation(panelLeftTop, polygon);
        let isRightBottom = google.maps.geometry.poly.containsLocation(panelRightBottom, polygon);
        let isRightTop = true;
        if (notFirstLine) {
            isRightTop = google.maps.geometry.poly.containsLocation(panelRightTop, polygon);
        }
        if (isLeftTop && isRightBottom && isRightTop) {
            const marker = new google.maps.Marker({
                position: points[i],
                map: map,
                icon: picture,
                title: 'Panel position'
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
