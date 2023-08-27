var imageUrl = null;
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
    const dataToSave = {
        'lat': map.getCenter().lat(),
        'lng': map.getCenter().lng(),
        'shapesData': shapesData,
        'shapes': convertShapesToJSON(shapes),
        'imageUrl': imageUrl,
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

function getPower(shapes, kwPerPanel){
    let panelsCount = 0;
    shapes.forEach(function (shape) {
        panelsCount += shape.panelsCount;
    });
    return Math.round(panelsCount * kwPerPanel, 2);
}

function getMapPicture() {
    // lock map moving
    map.setOptions({zoomControl: false, streetViewControl: false, mapTypeControl: false, fullscreenControl: false, draggable: false, scrollwheel: false, disableDoubleClickZoom: true});
    drawingManager.setOptions({drawingControl: false});
    map.setOptions({styles: [{featureType: "all", elementType: "labels", stylers: [{visibility: "off"}]}]});
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

function loadMapData(){
    if (mapData.latitude && mapData.longitude) {
        map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: mapData.latitude, lng: mapData.longitude}, zoom: 17, tilt: 0,
        });
    } else {
        map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 49.83137, lng: 18.16086}, zoom: 17, tilt: 0,
        });
    }
    return map;
}
