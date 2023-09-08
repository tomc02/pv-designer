let imageUrl = null;
let mapDataLoaded = false;

function sendData(dataToSend, url, customHeader, csrf_token) {
    $.ajax({
        url: url,
        method: "POST",
        data: {data: dataToSend},
        headers: {
            'Custom-Header': customHeader,
            'X-CSRFToken': csrf_token,
        },
        success: function (response) {
            console.log(response);
            window.location.href = formUrl + '?id=' + response.id;
        }
    });
}

function moveToForm() {
    let mapDataID = '';
    if (mapDataLoaded) {
        mapDataID = mapData.id;
    }
    const dataToSave = {
        'lat': map.getCenter().lat(),
        'lng': map.getCenter().lng(),
        'shapesData': shapesData,
        'shapes': convertShapesToJSON(shapes),
        'imageUrl': imageUrl,
        'zoom': map.zoom,
        'mapDataID': mapDataID,
    };
    sendData(JSON.stringify(dataToSave), ajaxUrl, 'Map-Data', csrfToken);
}

function convertShapesToJSON(shapes) {
    let shapesJSON = [];
    shapes.forEach(function (shape) {
        shapesJSON.push(shape.getPath().getArray());
    });
    return shapesJSON;
}

function getPower(shapes, kwPerPanel) {
    let panelsCount = 0;
    shapes.forEach(function (shape) {
        panelsCount += shape.panelsCount;
    });
    return Math.round(panelsCount * kwPerPanel, 2);
}

function getMapPicture() {
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
            center: {lat: mapData.latitude, lng: mapData.longitude}, zoom: mapData.zoom, tilt: 0,
        });
        map.setMapTypeId('satellite');
        mapData.areas.forEach(function (area) {
            polygon = new google.maps.Polygon({
                paths: area,
                strokeColor: '#0033ff',
                draggable: true,
                clickable: true,
                editable: true,
            });
            polygon.setMap(map);
            shapes.push(polygon);
        });
        mapDataLoaded = true;
    } else {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 49.83137, lng: 18.16086}, zoom: 17, tilt: 0,
        });
    }
    return map;
}

function getPvImgUrl() {
    const currentTime = new Date().getTime();
    return pvPanelImg + '?v=' + currentTime;
}
function getPvImgSelectedUrl() {
    const currentTime = new Date().getTime();
    return pvPanelSelectedImg + '?v=' + currentTime;
}
