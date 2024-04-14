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
        'imageUrl': imageUrl,
        'zoom': map.zoom,
        'mapDataID': mapDataID,
        'solarPanelID': solarPanelID,
    };
    sendData(JSON.stringify(dataToSave), ajaxUrl, 'Map-Data', csrfToken);
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

function showProcessing(controlPanelOnly = false) {
    if (controlPanelOnly) {
        // hide all content with class 'hide-able-content'
        $('.hide-able-content').hide();
    } else {
        $('#content').hide();
    }
    $('#loading').show();
    processing = true;
    console.log('showProcessing');
}

function hideProcessing() {
    if (processing) {
        $('#content').show();
        $('#loading').hide();
        processing = false;
    }
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
    $('#solarPanelSelect').change(function () {
        //hideChoosePanel();
        var selectedPanelId = $(this).val();
        solarPanelID = selectedPanelId;
        var selectedPanelWidth = $(this).find(':selected').data('width');
        var selectedPanelHeight = $(this).find(':selected').data('height');
        var selectedPanelPower = $(this).find(':selected').data('power');
        var selectedPanelImgSrc = $(this).find(':selected').data('img-src');

        shapesHandler.panelW = selectedPanelWidth;
        shapesHandler.panelH = selectedPanelHeight;

        shapesHandler.fillAllAreasWithPanels(true);
        shapesHandler.pvPanelSelected = true;
    });
}


function darkMode() {
    localStorage.setItem('lightMode', 'disabled');
    $('body').toggleClass("dark-mode");
    const navbar = $('#main_nav');
    $('html').attr('data-bs-theme', 'dark');
    navbar.removeClass('bg-light navbar-light').addClass('bg-dark navbar-dark');
    $('#darkModeSwitchLabel').html('<i class="bi bi-moon"></i>');

    $('.page-heading-section').removeClass('heading-section').addClass('heading-section-dark');
    $('#mapContainer').removeClass('map-container').addClass('map-container-dark');

    $('.help-gif').each(function() {
        var src = $(this).attr('src');
        var index = src.lastIndexOf('/');
        var filename = src.substring(index + 1);
        var newSrc = src.replace(filename, filename.replace('.webp', '-dark.webp'));
        $(this).attr('src', newSrc);
    });
}

function lightMode() {
    localStorage.setItem('lightMode', 'enabled');
    $('body').toggleClass("light-mode");
    const navbar = $('#main_nav');
    $('html').attr('data-bs-theme', 'light');
    navbar.removeClass('bg-dark navbar-dark').addClass('bg-light navbar-light');
    $('#darkModeSwitchLabel').html('<i class="bi bi-sun"></i>');

    $('.page-heading-section').removeClass('heading-section-dark').addClass('heading-section');
    $('#mapContainer').removeClass('map-container-dark').addClass('map-container');

    $('.help-gif').each(function() {
        var src = $(this).attr('src');
        var index = src.lastIndexOf('/');
        var filename = src.substring(index + 1);
        var newSrc = src.replace(filename, filename.replace('-dark.webp', '.webp'));
        $(this).attr('src', newSrc);
    });
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
