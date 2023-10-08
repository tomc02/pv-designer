class MarkersHandler {
    constructor() {
        this.markers = { '0': [], '1': [], '2': [], '3': [] };
        this.selectedMarker = null;
    }

    clearMarkers(areaIndex) {
        if (this.markers[areaIndex] !== undefined) {
            this.markers[areaIndex].forEach(function (marker) {
                marker.setMap(null);
            });
            this.markers[areaIndex] = [];
        }

        for (let i = areaIndex + 1; i < 4; i++) {
            this.markers[i - 1] = this.markers[i];
            this.markers[i] = [];
        }
    }

    putMarker(markerPosition, markerIcon, angle, areaIndex) {
        angle = angle + '';
        setTimeout(() => {
            const marker = new google.maps.Marker({
                position: markerPosition,
                map: map,
                icon: markerIcon,
                title: angle,
            });
            console.log('putMarker' + areaIndex);
            this.markers[areaIndex].push(marker);
            google.maps.event.addListener(marker, 'click', () => {
                this.selectMarker(marker);
            });
        }, 100);
    }

    getMarkerPicture(position, imgUrl, angle, index) {
        const angleAbs = Math.abs(angle);
        const panelWidthPix = calculatePixelSize(map, shapesHandler.getPanelWidth(index), position.lat());
        const panelHeightPix = calculatePixelSize(map, shapesHandler.getPanelHeight(index), position.lat());
        const rotatedPanelWidth = Math.abs(panelWidthPix * Math.cos(angleAbs * Math.PI / 180)) + panelHeightPix * Math.sin(angleAbs * Math.PI / 180);
        const rotatedPanelHeight = panelWidthPix * Math.sin(angleAbs * Math.PI / 180) + Math.abs(panelHeightPix * Math.cos(angleAbs * Math.PI / 180));

        let anchorY = panelWidthPix * Math.sin(angleAbs * Math.PI / 180);
        let anchorX = panelHeightPix * Math.sin(angleAbs * Math.PI / 180);
        console.warn(anchorX + ' ' + anchorY);
        console.log('angle: ' + angle + ' angleABS: ' + angleAbs);
        if (angle > 0) {
            anchorX = 0;
        } else {
            anchorY = 0;
        }
        return {
            url: imgUrl,
            scaledSize: new google.maps.Size(rotatedPanelWidth, rotatedPanelHeight),
            anchor: new google.maps.Point(anchorX, anchorY),
        };
    }

    selectMarker(marker) {
        // get index of marker in markers array
        const areaIndex = Object.keys(this.markers).find(key => this.markers[key].includes(marker));
        console.log('areaIndex: ' + areaIndex);
        this.clearMarkerSelection();
        this.selectedMarker = marker;
        marker.setDraggable(true);
        console.log('title:' + marker.title);
        marker.setIcon(this.getMarkerPicture(marker.getPosition(), getPvImgSelectedUrl(marker.title), marker.title), areaIndex);
        document.getElementById('markerDeleteButton').style.display = 'block';
    }

    clearMarkerSelection() {
        if (this.selectedMarker) {
            this.selectedMarker.setDraggable(false);
            this.selectedMarker.setIcon(this.getMarkerPicture(this.selectedMarker.getPosition(), getPvImgUrl(this.selectedMarker.title), this.selectedMarker.title));
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
}

const markerHandler = new MarkersHandler();
