let selectedMarker;

function clearMarkers() {
    markers.forEach(function (marker) {
        marker.setMap(null);
    });
    markers = [];
}

function putMarker(markerPosition, markerIcon, angle) {
    angle = angle + '';
    setTimeout(function () {
        const marker = new google.maps.Marker({
            position: markerPosition,
            map: map,
            icon: markerIcon,
            title: angle,
        });
        markers.push(marker);
        google.maps.event.addListener(marker, 'click', function () {
            selectMarker(marker);
        });
    }, 200);
}

function getMarkerPicture(position, imgUrl, angle) {
    const panelWidthPix = calculatePixelSize(map, panelWidth, position.lat());
    const panelHeightPix = calculatePixelSize(map, panelHeight, position.lat());
    const bx = panelWidthPix * Math.cos(angle * Math.PI / 180) + panelHeightPix * Math.sin(angle * Math.PI / 180);
    const by = panelWidthPix * Math.sin(angle * Math.PI / 180) + panelHeightPix * Math.cos(angle * Math.PI / 180);
    return {
        url: imgUrl,
        scaledSize: new google.maps.Size(bx, by),
        anchor: new google.maps.Point(0, 0),
    };
}

function selectMarker(marker) {
    clearMarkerSelection();
    selectedMarker = marker;
    marker.setDraggable(true);
    console.log(marker.title);
    marker.setIcon(getMarkerPicture(marker.getPosition(), getPvImgSelectedUrl(), marker.title));
}

function clearMarkerSelection() {
    if (selectedMarker) {
        selectedMarker.setDraggable(false);
        selectedMarker.setIcon(getMarkerPicture(selectedMarker.getPosition(), getPvImgUrl(), selectedMarker.title));
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

function isPanelInPolygon(leftTop, polygon, notFirstLine, headingLTR, headingRTD) {
    let panelLeftTop = leftTop;
    console.log(headingLTR, headingRTD);
    let panelRightTop = google.maps.geometry.spherical.computeOffset(panelLeftTop, panelWidth, headingLTR);
    let panelRightBottom = google.maps.geometry.spherical.computeOffset(panelRightTop, panelHeight, headingRTD);
    let isLeftTop = google.maps.geometry.poly.containsLocation(panelLeftTop, polygon);
    let isRightBottom = google.maps.geometry.poly.containsLocation(panelRightBottom, polygon);
    let isRightTop = true;
    if (notFirstLine) {
        isRightTop = google.maps.geometry.poly.containsLocation(panelRightTop, polygon);
    }
    return !!(isLeftTop && isRightBottom && isRightTop);
}