class MarkersHandler {
    constructor() {
        this.markers = {'0': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6' : [], '7': [], '8': [], '9' : []};
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
        for (let i = areaIndex; i < 10; i++) {
            this.markers[i] = this.markers[i + 1];
        }
    }

    putMarker(markerPosition, markerIcon, angle, areaIndex) {
        angle = Math.round(angle*100)/100;
        angle = angle + '';
        setTimeout(() => {
            const marker = new google.maps.Marker({
                position: markerPosition,
                map: map,
                icon: markerIcon,
                title: angle,
                zIndex: 1,
            });
            this.markers[areaIndex].push(marker);
            google.maps.event.addListener(marker, 'click', () => {
                this.selectMarker(marker);
            });
        }, 100);
    }

getMarkerPicture(position, imgUrl, theta) {
    const panelWidthPix = calculatePixelSize(map, shapesHandler.getPanelWidth(shapesHandler.selectedShapeIndex), position.lat());
    const panelHeightPix = calculatePixelSize(map, shapesHandler.getPanelHeight(shapesHandler.selectedShapeIndex), position.lat());

    const width = shapesHandler.getPanelWidth(shapesHandler.selectedShapeIndex);
    const height = shapesHandler.getPanelHeight(shapesHandler.selectedShapeIndex);

    let radians = (theta * Math.PI) / 180;

    // Calculate bounding box dimensions
    let cosTheta = Math.abs(Math.cos(radians));
    let sinTheta = Math.abs(Math.sin(radians));
    let newWidth = panelWidthPix * cosTheta + panelHeightPix * sinTheta;
    let newHeight = panelWidthPix * sinTheta + panelHeightPix * cosTheta;

    // Initialize anchor points
    let anchorX = 0;
    let anchorY = 0;

    // Adjust anchor points based on the quadrant
    if (theta <= 0) {
        anchorX = panelHeightPix * sinTheta;
        anchorY = 0;
    }else if (theta <= 90) {
        anchorX = 0;
        anchorY = panelWidthPix * sinTheta;
    } else if (theta <= 180) {
        anchorX = 0;
        anchorY = panelHeightPix * cosTheta;
    } else if (theta <= 270) {
        anchorX = panelWidthPix * cosTheta + panelHeightPix * sinTheta;
        anchorY = newHeight;
    } else {
    }

    return {
        url: imgUrl,
        scaledSize: new google.maps.Size(newWidth, newHeight),
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
        //return angle > 180 ? angle - 180 : angle;
        return angle;
    }
}

const markerHandler = new MarkersHandler();
