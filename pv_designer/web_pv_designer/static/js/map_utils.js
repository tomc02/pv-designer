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

function getPvImgUrl(angle) {
    const currentTime = new Date().getTime();
    return pvPanelImg + angle + '.png' + '?v=' + currentTime;
}

function getPvImgSelectedUrl(angle) {
    console.log('getPvImgSelectedUrl' + angle);
    const currentTime = new Date().getTime();
    return pvPanelSelectedImg + angle + '.png' + '?v=' + currentTime;
}

function getMapPicture() {
    enableTab();
    document.getElementById('markerDeleteButton').style.display = 'none';
    // lock map moving
    map.setOptions({
        zoomControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        draggable: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,

    });
    drawingManager.setOptions({drawingControl: false});
    map.setOptions({styles: [{featureType: "all", elementType: "labels", stylers: [{visibility: "off"}]}]});
    clearSelection();
    clearMarkerSelection();
    setTimeout(function () {
        html2canvas(document.querySelector('#map'), {
            backgroundColor: null,
            useCORS: true
        }).then(canvas => {
            imageUrl = canvas.toDataURL();
            moveToForm();
        });
    }, 800);
}

function loadMapData() {
    if (mapData.latitude && mapData.longitude) {
        console.log(mapData);
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: mapData.latitude, lng: mapData.longitude}, zoom: mapData.zoom, tilt: 0, rotateControl: false,
        });
        map.setMapTypeId('satellite');
        mapData.areas.forEach(function (area) {
            let polygon = new google.maps.Polygon({
                paths: area,
                strokeColor: '#0033ff',
                draggable: false,
                editable: false,
            });
            polygon.setMap(map);
            google.maps.event.addListener(polygon, 'click', function () {
                selectShape(polygon);
            });
            shapes.push(polygon);
            addControlPanel();
        });
        mapDataLoaded = true;
    } else {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 49.83137, lng: 18.16086}, zoom: 17, tilt: 0, rotateControl: false,
        });
    }

    /* create delete button
    <button className="btn btn-danger" onClick="deleteShape()">
                            <i className="bi bi-trash"></i>
                        </button> */

    const deleteButton = document.createElement('button');
    deleteButton.id = 'markerDeleteButton';
    deleteButton.classList.add('btn', 'btn-danger');
    deleteButton.addEventListener('click', function () {
        let selectedMarkerKey = Object.keys(markers).find(key => markers[key].includes(selectedMarker));
        deleteMarker(selectedMarkerKey);
        deleteButton.style.display = 'none';
    });
    // add padding to the button
    deleteButton.style.marginRight = '10px';
    const deleteButtonIcon = document.createElement('i');
    deleteButtonIcon.classList.add('bi', 'bi-trash');
    deleteButton.appendChild(deleteButtonIcon);

    // Add the custom button to the map
    map.controls[google.maps.ControlPosition.RIGHT].push(deleteButton);
    deleteButton.style.display = 'none';

    clearHighlight();
    return map;
}