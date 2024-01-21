class MarkersHandler {
    constructor() {
        this.markers = {'0': [], '1': [], '2': [], '3': []};
        this.selectedMarker = null;
    }

    clearMarkers(areaIndex) {
        console.log('clearMarkers: ' + areaIndex);
        if (this.markers[areaIndex] !== undefined) {
            this.markers[areaIndex].forEach(function (marker) {
                marker.setMap(null);
            });
            this.markers[areaIndex] = [];
        }
    }

    deleteMarkersArea(areaIndex) {
        console.log('deleteMarkersArea: ' + areaIndex);
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
        console.log('angleAbs: ' + angle);
        const angleAbs = Math.abs(this.clipAngle(angle));
        const panelWidthPix = calculatePixelSize(map, shapesHandler.getPanelWidth(shapesHandler.selectedShapeIndex), position.lat());
        const panelHeightPix = calculatePixelSize(map, shapesHandler.getPanelHeight(shapesHandler.selectedShapeIndex), position.lat());
        let rotatedPanelWidth = Math.abs(panelWidthPix * Math.cos(angleAbs * Math.PI / 180)) + panelHeightPix * Math.sin(angleAbs * Math.PI / 180);
        let rotatedPanelHeight = panelWidthPix * Math.sin(angleAbs * Math.PI / 180) + Math.abs(panelHeightPix * Math.cos(angleAbs * Math.PI / 180));

        let anchorY = panelWidthPix * Math.sin(angleAbs * Math.PI / 180);
        let anchorX = panelHeightPix * Math.sin(angleAbs * Math.PI / 180);

        if (angle < 180) {
            if (angle > 0) {
                anchorX = 0;
            } else {
                anchorY = 0;
            }
        }
        console.log('anchorX: ' + anchorX);
        console.log('anchorY: ' + anchorY);
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
