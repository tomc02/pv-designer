let imageUrl = null;
let mapDataLoaded = false;
let processing = false;

function sendData(dataToSend, url, customHeader, csrf_token) {
    showProcessing();
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
            window.location.href = resultUrl + '?id=' + response.id;
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

function showProcessing() {
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    processing = true;
}

function hideProcessing() {
    if (processing) {
        document.getElementById('content').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
        processing = false;
    }
}
function showChoosePanel() {
    document.getElementById('choose').style.display = 'block';
    document.getElementById('map_content').style.display = 'none';
    document.getElementById('searchInput').style.display = 'none';
    document.getElementById('searchButton').style.display = 'none';
}

function hideChoosePanel() {
    document.getElementById('choose').style.display = 'none';
    document.getElementById('map_content').style.display = 'block';
    document.getElementById('searchInput').style.display = 'block';
    document.getElementById('searchButton').style.display = 'block';

}

function addBackButtonListener() {
    window.addEventListener('pageshow', function (event) {
            if (event.persisted) {
                hideProcessing();
            } else {
            }
        });
}

function showCalculationResult(id){
    showProcessing();
    window.location.href = getResultUrl + '?id=' + id;
}

function addSelectListener() {
document.getElementById('solarPanelSelect').addEventListener('change', function() {
        hideChoosePanel();
        var selectedPanelId = this.value;
        var selectedPanelWidth = this.options[this.selectedIndex].getAttribute('data-width');
        var selectedPanelHeight = this.options[this.selectedIndex].getAttribute('data-height');
        var selectedPanelPower = this.options[this.selectedIndex].getAttribute('data-power');
        var selectedPanelImgSrc = this.options[this.selectedIndex].getAttribute('data-img-src');

        // Now you have the selectedPanelId, selectedPanelWidth, selectedPanelHeight, and selectedPanelPower
        // You can use these values as needed.
        // For example, you can display them or use them in further calculations.

        console.log("Selected Panel ID:", selectedPanelId);
        console.log("Selected Panel Width:", selectedPanelWidth);
        console.log("Selected Panel Height:", selectedPanelHeight);
        console.log("Selected Panel Power:", selectedPanelPower);

        shapesHandler.panelW = selectedPanelWidth;
        shapesHandler.panelH = selectedPanelHeight;
        shapesHandler.fillAllAreasWithPanels();
    });
}


