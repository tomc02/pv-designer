class MarkersHandler {
    constructor() {
        this.markers = {'0': [], '1': [], '2': [], '3': []};
        this.selectedMarker = null;
    }

    clearMarkers(areaIndex) {
        if (this.markers[areaIndex] !== undefined) {
            this.markers[areaIndex].forEach(function (marker) {
                marker.setMap(null);
            });
            this.markers[areaIndex] = [];
        }
    }

    deleteMarkersArea(areaIndex) {
        this.clearMarkers(areaIndex);
        for (let i = areaIndex; i < 3; i++) {
            this.markers[i] = this.markers[i + 1];
        }
    }

    putMarker(markerPosition, markerIcon, angle, areaIndex) {
        angle = Math.round(angle);
        angle = angle + '';
        setTimeout(() => {
            const marker = new google.maps.Marker({
                position: markerPosition,
                map: map,
                icon: markerIcon,
                title: angle,
            });
            this.markers[areaIndex].push(marker);
            google.maps.event.addListener(marker, 'click', () => {
                this.selectMarker(marker);
            });
        }, 100);
    }

getMarkerPicture(position, imgUrl, angle) {
    const angleAbs = Math.abs(this.clipAngle(angle));
    const panelWidthPix = calculatePixelSize(map, shapesHandler.getPanelWidth(shapesHandler.selectedShapeIndex), position.lat());
    const panelHeightPix = calculatePixelSize(map, shapesHandler.getPanelHeight(shapesHandler.selectedShapeIndex), position.lat());

    const angleRad = angleAbs * Math.PI / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    let rotatedPanelWidth = Math.abs(panelWidthPix * cosAngle) + panelHeightPix * sinAngle;
    let rotatedPanelHeight = panelWidthPix * sinAngle + Math.abs(panelHeightPix * cosAngle);

    let anchorY = panelWidthPix * sinAngle;
    let anchorX = panelHeightPix * sinAngle;

    if (angle < 120) {
        anchorX = angle > 0 ? 0 : anchorX;
        anchorY = angle > 0 ? anchorY : 0;
    } else {
        if (angle > 180) {
            anchorX = panelWidthPix * cosAngle + panelHeightPix * sinAngle;
            anchorY = rotatedPanelHeight;
        } else {
            anchorY = rotatedPanelHeight;
        }
    }

    return {
        url: imgUrl,
        scaledSize: new google.maps.Size(rotatedPanelWidth, rotatedPanelHeight),
        anchor: new google.maps.Point(anchorX, anchorY),
    };
}

    selectMarker(marker) {
        this.clearMarkerSelection();
        this.selectedMarker = marker;
        const areaIndex = Object.keys(this.markers).find(key => this.markers[key].includes(marker));
        shapesHandler.selectShapeByIndex(areaIndex);
        marker.setDraggable(true);
        console.log('title:' + marker.title);
        marker.setIcon(this.getMarkerPicture(marker.getPosition(), getPvImgSelectedUrl(this.clipAngle(marker.title)), marker.title));
        document.getElementById('markerDeleteButton').style.display = 'block';
    }

    clearMarkerSelection() {
        if (this.selectedMarker) {
            this.selectedMarker.setDraggable(false);
            this.selectedMarker.setIcon(this.getMarkerPicture(this.selectedMarker.getPosition(), getPvImgUrl(this.clipAngle(this.selectedMarker.title)), this.selectedMarker.title));
            this.selectedMarker = null;
            document.getElementById('markerDeleteButton').style.display = 'none';
        }
    }

    deleteMarker(areaIndex) {
        if (this.selectedMarker) {
            this.selectedMarker.setMap(null);
            const index = this.markers[areaIndex].indexOf(this.selectedMarker);
            if (index !== -1) {
                this.markers[areaIndex].splice(index, 1);
            }
            this.selectedMarker = null;
            refreshPanelsCount();
        }
    }

    clipAngle(angle) {
        return angle > 180 ? angle - 180 : angle;
    }
}

const markerHandler = new MarkersHandler();
