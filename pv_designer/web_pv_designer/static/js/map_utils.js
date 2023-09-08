let selectedMarker;
function clearMarkers() {
    markers.forEach(function (marker) {
        marker.setMap(null);
    });
    markers = [];
}
function putMarker(markerPosition, markerIcon) {
    const marker = new google.maps.Marker({
        position: markerPosition,
        map: map,
        icon: markerIcon,
    });
    markers.push(marker);
    google.maps.event.addListener(marker, 'click', function () {
        selectMarker(marker);
    });
}
function getMarkerPicture(position, imgUrl){
    const panelWidthPix = calculatePixelSize(map, panelWidthRotated, position.lat());
    const panelHeightPix = calculatePixelSize(map, panelHeightRotated, position.lat());
    return {
        url: imgUrl,
        scaledSize: new google.maps.Size(panelWidthPix, panelHeightPix),
        anchor: new google.maps.Point(0, 0)

    };
}
function selectMarker(marker){
    clearMarkerSelection();
    selectedMarker = marker;
    marker.setDraggable(true);
    marker.setIcon(getMarkerPicture(marker.getPosition(), getPvImgSelectedUrl()));
}
function clearMarkerSelection(){
    if (selectedMarker) {
        selectedMarker.setDraggable(false);
        selectedMarker.setIcon(getMarkerPicture(selectedMarker.getPosition(), getPvImgUrl()));
        selectedMarker = null;
    }
}
function deleteMarker() {
    if (selectedMarker) {
        selectedMarker.setMap(null); // Remove shape from the map
        const index = markers.indexOf(selectedMarker);
        if (index !== -1) {
            markers.splice(index, 1); // Remove shape from the shapes array
        }
        selectedMarker = null;
    }
}

function isPanelInPolygon(leftTop, polygon, notFirstLine){
        let panelLeftTop = leftTop;
        let panelRightTop = google.maps.geometry.spherical.computeOffset(panelLeftTop, panelWidth, 90);
        let panelRightBottom = google.maps.geometry.spherical.computeOffset(panelRightTop, panelHeight, 180);
        let isLeftTop = google.maps.geometry.poly.containsLocation(panelLeftTop, polygon);
        let isRightBottom = google.maps.geometry.poly.containsLocation(panelRightBottom, polygon);
        let isRightTop = true;
        if (notFirstLine) {
            isRightTop = google.maps.geometry.poly.containsLocation(panelRightTop, polygon);
        }
        return !!(isLeftTop && isRightBottom && isRightTop);
}