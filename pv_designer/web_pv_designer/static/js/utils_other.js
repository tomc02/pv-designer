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
    shapesHandler.prepareAreasData();
    let mapDataID = '';
    if (mapDataLoaded) {
        mapDataID = mapData.id;
    }
    const dataToSave = {
        'lat': map.getCenter().lat(),
        'lng': map.getCenter().lng(),
        'shapesData': shapesHandler.prepareAreasData(),
        'shapes': convertShapesToJSON(shapesHandler.shapesObjects),
        'imageUrl': imageUrl,
        'zoom': map.zoom,
        'mapDataID': mapDataID,
        'instanceID': instanceID,
    };
    sendData(JSON.stringify(dataToSave), ajaxUrl, 'Map-Data', csrfToken);

    // if
}

function convertShapesToJSON(shapes) {
    let shapesJSON = [];
    shapes.forEach(function (shape) {
        shapesJSON.push(shape.getShape().getPath().getArray());
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

function enableTab() {
    /* enable tab2-tab

        <ul class="nav nav-tabs" id="myTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <a class="nav-link active" id="tab1-tab" data-bs-toggle="tab" href="#tab1" role="tab"
                   aria-controls="tab1" aria-selected="true">Map</a>
            </li>
            <li class="nav-item" role="presentation">
                <a class="nav-link disabled" id="tab2-tab" data-bs-toggle="tab" href="#tab2" role="tab" aria-controls="tab2"
                   aria-selected="false" aria-disabled="true" >Other data</a>
            </li>
        </ul>
    */
    const tab2 = document.getElementById('tab2-tab');
    tab2.classList.remove('disabled');
    tab2.removeAttribute('aria-disabled');
}


