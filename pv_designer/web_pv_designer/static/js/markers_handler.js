var markers = [];
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
    const angleAbs = Math.abs(angle);
    const panelWidthPix = calculatePixelSize(map, panelWidth, position.lat());
    const panelHeightPix = calculatePixelSize(map, panelHeight, position.lat());
    const rotatedPanelWidth = panelWidthPix * Math.cos(angleAbs * Math.PI / 180) + panelHeightPix * Math.sin(angleAbs * Math.PI / 180);
    const rotatedPanelHeight = panelWidthPix * Math.sin(angleAbs * Math.PI / 180) + panelHeightPix * Math.cos(angleAbs * Math.PI / 180);
    let anchorY = panelWidthPix * Math.sin(angleAbs * Math.PI / 180);
    let anchorX = panelHeightPix * Math.sin(angleAbs * Math.PI / 180);

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

function selectMarker(marker) {
    clearMarkerSelection();
    selectedMarker = marker;
    marker.setDraggable(true);
    console.log('title:' + marker.title);
    marker.setIcon(getMarkerPicture(marker.getPosition(), getPvImgSelectedUrl(marker.title), marker.title));
}

function clearMarkerSelection() {
    if (selectedMarker) {
        selectedMarker.setDraggable(false);
        selectedMarker.setIcon(getMarkerPicture(selectedMarker.getPosition(), getPvImgUrl(selectedMarker.title), selectedMarker.title));
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