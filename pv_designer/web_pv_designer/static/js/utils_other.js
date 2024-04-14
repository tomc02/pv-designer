let imageUrl = null;
let mapDataLoaded = false;
let processing = false;

function sendData(dataToSend, url, customHeader, csrf_token) {
    showProcessing();
    fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Custom-Header': customHeader,
            'X-CSRFToken': csrf_token
        },
        body: dataToSend
    })
        .then(response => response.json())
        .then(response => {
            console.log(response);
            window.location.href = resultUrl + '?id=' + response.id;
        })
        .catch(error => console.error('Error:', error));
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
        var hideableContent = document.querySelectorAll('.hide-able-content');
        hideableContent.forEach(function (content) {
            content.style.display = 'none';
        });
    } else {
        var content = document.getElementById('content');
        if (content) {
            content.style.display = 'none';
        }
    }
    var loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'block';
    }
    processing = true;
    console.log('showProcessing');
}

function hideProcessing() {
    if (processing) {
        var content = document.getElementById('content');
        if (content) {
            content.style.display = 'block';
        }
        var loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
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
    var solarPanelSelect = document.getElementById('solarPanelSelect');
    solarPanelSelect.addEventListener('change', function () {
        //hideChoosePanel();
        var selectedOption = this.options[this.selectedIndex];
        var selectedPanelId = selectedOption.value;
        solarPanelID = selectedPanelId;
        var selectedPanelWidth = selectedOption.getAttribute('data-width');
        var selectedPanelHeight = selectedOption.getAttribute('data-height');
        var selectedPanelPower = selectedOption.getAttribute('data-power');
        var selectedPanelImgSrc = selectedOption.getAttribute('data-img-src');

        shapesHandler.panelW = selectedPanelWidth;
        shapesHandler.panelH = selectedPanelHeight;

        shapesHandler.fillAllAreasWithPanels(true);
        shapesHandler.pvPanelSelected = true;
    });
}

function darkMode() {
    localStorage.setItem('lightMode', 'disabled');
    document.body.classList.toggle("dark-mode");
    const navbar = document.getElementById('main_nav');
    const mapContainer = document.getElementById('mapContainer');
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    if (navbar !== null) {
        navbar.classList.remove('bg-light', 'navbar-light');
        navbar.classList.add('bg-dark', 'navbar-dark');
    }
    if (mapContainer !== null) {
        mapContainer.classList.remove('map-container');
        mapContainer.classList.add('map-container-dark');
    }
    if (document.getElementById('darkModeSwitchLabel') !== null)
        document.getElementById('darkModeSwitchLabel').innerHTML = '<i class="bi bi-moon"></i>';

    var helpGifs = document.querySelectorAll('.help-gif');
    helpGifs.forEach(function (gif) {
        var src = gif.getAttribute('src');
        var index = src.lastIndexOf('/');
        var filename = src.substring(index + 1);
        var newSrc = src.replace(filename, filename.replace('.webp', '-dark.webp'));
        gif.setAttribute('src', newSrc);
    });
}

function lightMode() {
    localStorage.setItem('lightMode', 'enabled');
    document.body.classList.toggle("light-mode");
    const navbar = document.getElementById('main_nav');
    const mapContainer = document.getElementById('mapContainer');
    document.documentElement.setAttribute('data-bs-theme', 'light');
    if (navbar !== null) {
        navbar.classList.remove('bg-dark', 'navbar-dark');
        navbar.classList.add('bg-light', 'navbar-light');
    }
    if (mapContainer !== null) {
        mapContainer.classList.remove('map-container-dark');
        mapContainer.classList.add('map-container');
    }
    if (document.getElementById('darkModeSwitchLabel') !== null)
        document.getElementById('darkModeSwitchLabel').innerHTML = '<i class="bi bi-sun"></i>';

    var helpGifs = document.querySelectorAll('.help-gif');
    helpGifs.forEach(function (gif) {
        var src = gif.getAttribute('src');
        var index = src.lastIndexOf('/');
        var filename = src.substring(index + 1);
        var newSrc = src.replace(filename, filename.replace('-dark.webp', '.webp'));
        gif.setAttribute('src', newSrc);
    });
}


function updateSolarPanels() {
    fetch('/get_solar_panels/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update the content of the solar panel select
            const solarPanelSelect = document.getElementById('solarPanelSelect');
            solarPanelSelect.innerHTML = ''; // Clear previous options
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select a solar panel';
            defaultOption.selected = true;
            defaultOption.disabled = true;
            defaultOption.hidden = true;
            solarPanelSelect.appendChild(defaultOption);

            data.forEach(panel => {
                const option = document.createElement('option');
                option.value = panel.id;
                option.dataset.width = panel.width;
                option.dataset.height = panel.height;
                option.dataset.power = panel.power;
                option.dataset.imgSrc = panel.image;
                option.textContent = panel.str;
                solarPanelSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching solar panels:', error);
        });
}


function showStep(step) {
    var stepContents = document.querySelectorAll('.step-content');
    stepContents.forEach(function (content) {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    var stepContent = document.querySelector(`[data-step="${step}"]`);
    if (stepContent) {
        stepContent.classList.add('active');
        stepContent.style.display = 'block';
    }
    var currentStep = document.getElementById('currentStep');
    if (currentStep) {
        currentStep.textContent = step;
    }
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
