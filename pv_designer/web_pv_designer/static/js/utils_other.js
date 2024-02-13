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
        'solarPanelID': solarPanelID,
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

function showCalculationResult(id) {
    showProcessing();
    window.location.href = getResultUrl + '?id=' + id;
}

function addSelectListener() {
    document.getElementById('solarPanelSelect').addEventListener('change', function () {
        //hideChoosePanel();
        var selectedPanelId = this.value;
        solarPanelID = selectedPanelId;
        var selectedPanelWidth = this.options[this.selectedIndex].getAttribute('data-width');
        var selectedPanelHeight = this.options[this.selectedIndex].getAttribute('data-height');
        var selectedPanelPower = this.options[this.selectedIndex].getAttribute('data-power');
        var selectedPanelImgSrc = this.options[this.selectedIndex].getAttribute('data-img-src');

        shapesHandler.panelW = selectedPanelWidth;
        shapesHandler.panelH = selectedPanelHeight;

        shapesHandler.fillAllAreasWithPanels(true);
        shapesHandler.pvPanelSelected = true;
    });
}

function darkMode() {
    document.body.classList.toggle("dark-mode");
    const navbar = document.getElementById('main_nav');
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    navbar.classList.remove('bg-light');
    navbar.classList.remove('navbar-light');
    navbar.classList.add('bg-dark');
    navbar.classList.add('navbar-dark');
    const label = document.getElementById('darkModeSwitchLabel');
    label.innerHTML = '<i class="bi bi-moon"></i>';
}

function lightMode() {
    document.body.classList.toggle("light-mode");
    const navbar = document.getElementById('main_nav');
    document.documentElement.setAttribute('data-bs-theme', 'light');
    navbar.classList.remove('bg-dark');
    navbar.classList.remove('navbar-dark');
    navbar.classList.add('bg-light');
    navbar.classList.add('navbar-light');
    const label = document.getElementById('darkModeSwitchLabel');
    label.innerHTML = '<i class="bi bi-sun"></i>';
}

function updateSolarPanels() {
    $.ajax({
        url: '/get_solar_panels/',  // Update with your actual URL
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            // Update the content of the solar panel select
            const solarPanelSelect = $('#solarPanelSelect');
            solarPanelSelect.empty();
            solarPanelSelect.append('<option value="" selected disabled hidden>Select a solar panel</option>');
            data.forEach(function (panel) {
                solarPanelSelect.append(`<option value="${panel.id}" data-width="${panel.width}" data-height="${panel.height}" data-power="${panel.power}" data-img-src="${panel.image}">${panel.str}</option>`);
            });
        },
        error: function (error) {
            console.log('Error fetching solar panels:', error);
        }
    });
}

function showStep(step) {
    $('.step-content').removeClass('active').hide();
    $(`[data-step="${step}"]`).addClass('active').show();
    $('#currentStep').text(step); // Update step counter
}

function changeStep(direction) {
    currentStep += direction;
    if (currentStep < 1) {
        currentStep = 1;
    } else if (currentStep > totalSteps) {
        currentStep = totalSteps;
    }
    showStep(currentStep);
}
