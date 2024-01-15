class AreaHandler {
    constructor(panelHeight, panelWidth) {
        this.shapesData = [];
        this.panelHeight = panelHeight;
        this.panelWidth = panelWidth;
        this.isFilled = false;
    }

    recalculatePanelHeight(slopeDegrees) {
        slopeDegrees = 90 - slopeDegrees;
        this.panelHeight = this.panelHeight * Math.sin(slopeDegrees * Math.PI / 180);
    }

    fillPolygon(index, roofSlope) {
        let cornerPoints;
        if (!this.isFilled) {
            cornerPoints = sortCorners(shapes[index].getPath().getArray());
            //cornerPoints = calculateSlopeDimensions(cornerPoints, 55);
            this.isFilled = true;
        } else {
            cornerPoints = getCornerPoints(shapes[index]);
        }
        this.recalculatePanelHeight(roofSlope);

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

    drawPoints(points, polygon, notFirstLine = false, headingLTR, headingRTD, pvPanelUrl, polygonIndex) {
        let panelCount = 0;
        const leftTop = polygon.getPath().getAt(0);
        const angle = 90 - headingLTR;
        const picture = markerHandler.getMarkerPicture(leftTop, pvPanelUrl, angle);
        for (let i = 0; i < points.length; i++) {
            if (isPanelInPolygon(points[i], polygon, notFirstLine, headingLTR, headingRTD)) {
                markerHandler.putMarker(points[i], picture, angle, polygonIndex);
                panelCount++;
            }
        }
        return panelCount;
    }
}