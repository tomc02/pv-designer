var imageUrl;
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
    getMapPicture();
    setTimeout(function () {
    const dataToSave = {
        'lat': map.getCenter().lat(),
        'lng': map.getCenter().lng(),
        'shapesData': shapesData,
        'shapes': convertShapesToJSON(shapes),
        'imageUrl': imageUrl,
    };
    sendData(JSON.stringify(dataToSave), ajaxUrl, 'Map-Data', csrfToken);
    }, 1000);

}

function convertShapesToJSON(shapes) {
    let shapesJSON = [];
    shapes.forEach(function (shape) {
        shapesJSON.push(shape.getPath().getArray());
    });
    return shapesJSON;
}

function parseMapData() {
    const urlParams = new URLSearchParams(window.location.search);
    const mapDataParam = urlParams.get('mapData');
    const mapData = JSON.parse(mapDataParam);
    console.log(mapData);
    return mapData;
}
function getPower(shapes, kwPerPanel){
    let panelsCount = 0;
    shapes.forEach(function (shape) {
        panelsCount += shape.panelsCount;
    });
    return panelsCount * kwPerPanel;
}

function getMapPicture() {
    // lock map moving
    map.setOptions({zoomControl: false, streetViewControl: false, mapTypeControl: false, fullscreenControl: false, draggable: false, scrollwheel: false, disableDoubleClickZoom: true});
    drawingManager.setOptions({drawingControl: false});
    map.setOptions({styles: [{featureType: "all", elementType: "labels", stylers: [{visibility: "off"}]}]});
    setTimeout(function () {
        //take the screenshot
        html2canvas(document.querySelector('#map'), {
            backgroundColor: null,
            useCORS: true
        }).then(canvas => {
            imageUrl = canvas.toDataURL();
        });
    }, 100);
}
