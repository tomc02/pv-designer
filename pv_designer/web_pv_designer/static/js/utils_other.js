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
        }
    });
}

function moveToForm() {
    dataToSend = {
        'lat': map.getCenter().lat(),
        'lng': map.getCenter().lng(),
        'zoom': map.getZoom(),
        'shapes': shapesData,
    };
    dataToSend = JSON.stringify(dataToSend);
    sendData(dataToSend, ajaxUrl, 'Map-Data', csrfToken);
    window.location.href = formUrl + '?mapData=' + dataToSend;
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