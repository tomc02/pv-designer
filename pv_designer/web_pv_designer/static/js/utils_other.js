var imageUrl;
function sendData(dataToSend, url, customHeader, csrf_token) {
    console.log(csrf_token);
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
    const dataToSend = {
        'lat': map.getCenter().lat(),
        'lng': map.getCenter().lng(),
        'shapes': shapesData,
    };
    let dataToSave = {
        'lat': map.getCenter().lat(),
        'lng': map.getCenter().lng(),
        'shapesData': shapesData,
        'shapes': convertShapesToJSON(shapes),
        'imageUrl': imageUrl,
    };
    dataToSave = JSON.stringify(dataToSave);
    sendData(dataToSave, ajaxUrl, 'Map-Data', csrfToken);
    window.location.href = formUrl + '?mapData=' + JSON.stringify(dataToSend);
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
    //hide the map controls (zoom, street view, drawing manager, etc.)
    map.setOptions({zoomControl: false, streetViewControl: false, mapTypeControl: false, fullscreenControl: false});
    drawingManager.setOptions({drawingControl: false});
    map.setOptions({styles: [{featureType: "all", elementType: "labels", stylers: [{visibility: "off"}]}]});
    setTimeout(function () {
        //take the screenshot
        html2canvas(document.querySelector('#map'), {
            backgroundColor: null,
            useCORS: true
        }).then(canvas => {
            //show the map controls again
            map.setOptions({zoomControl: true, streetViewControl: true, mapTypeControl: true});
            //add the screenshot to the page
            document.body.appendChild(canvas);
            //save the screenshot
            imageUrl = canvas.toDataURL();
        });
    }, 200);
}
