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



