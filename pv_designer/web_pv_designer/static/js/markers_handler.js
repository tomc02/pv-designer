var markers = {'0': [], '1': [], '2': [], '3': []}
let selectedMarker;

function clearMarkers(areaIndex) {
    if (markers[areaIndex] !== undefined) {
        markers[areaIndex].forEach(function (marker) {
            marker.setMap(null);
        });
        markers[areaIndex] = [];
    }
}

function putMarker(markerPosition, markerIcon, angle, areaIndex) {
    angle = angle + '';
    setTimeout(function () {
        const marker = new google.maps.Marker({
            position: markerPosition,
            map: map,
            icon: markerIcon,
            title: angle,
        });
        console.log('putMarker' + areaIndex);
        markers[areaIndex].push(marker);
        google.maps.event.addListener(marker, 'click', function () {
            selectMarker(marker);
        });
    }, 100);
}

function getMarkerPicture(position, imgUrl, angle) {
    const angleAbs = Math.abs(angle);
    const panelWidthPix = calculatePixelSize(map, panelWidth, position.lat());
    const panelHeightPix = calculatePixelSize(map, panelHeight, position.lat());
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

function selectMarker(marker, areaIndex) {
    clearMarkerSelection();
    selectedMarker = marker;
    marker.setDraggable(true);
    console.log('title:' + marker.title);
    marker.setIcon(getMarkerPicture(marker.getPosition(), getPvImgSelectedUrl(marker.title), marker.title));
    document.getElementById('markerDeleteButton').style.display = 'block';
}

function clearMarkerSelection() {
    if (selectedMarker) {
        selectedMarker.setDraggable(false);
        selectedMarker.setIcon(getMarkerPicture(selectedMarker.getPosition(), getPvImgUrl(selectedMarker.title), selectedMarker.title));
        selectedMarker = null;
    }
}

function deleteMarker(areaIndex) {
    if (selectedMarker) {
        selectedMarker.setMap(null); // Remove shape from the map
        const index = markers[areaIndex].indexOf(selectedMarker);
        if (index !== -1) {
            markers[areaIndex].splice(index, 1); // Remove shape from the shapes array
        }
        selectedMarker = null;
        refreshPanelsCount();
    }
}
