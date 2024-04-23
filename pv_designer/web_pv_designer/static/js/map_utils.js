let mapAttribution = false;

function isPanelInPolygon(leftTop, polygon, notFirstLine, headingLTR, headingRTD) {
    let panelLeftTop = leftTop;
    let panelRightTop = google.maps.geometry.spherical.computeOffset(panelLeftTop, shapesHandler.getPanelWidth(), headingLTR);
    let panelRightBottom = google.maps.geometry.spherical.computeOffset(panelRightTop, shapesHandler.getPanelHeight(), headingRTD);
    let isLeftTop = google.maps.geometry.poly.containsLocation(panelLeftTop, polygon);
    let isRightBottom = google.maps.geometry.poly.containsLocation(panelRightBottom, polygon);
    let isRightTop = true;
    if (notFirstLine) {
        isRightTop = google.maps.geometry.poly.containsLocation(panelRightTop, polygon);
    }
    return !!(isLeftTop && isRightBottom && isRightTop);
}

function getPvImgUrl(angle) {
    const currentTime = new Date().getTime();
    angle = Math.round(angle * 100) / 100;
    return pvPanelImg + angle + '.png' + '?v=' + currentTime;
}

function getPvImgSelectedUrl(angle) {
    const currentTime = new Date().getTime();
    angle = Math.round(angle * 100) / 100;
    return pvPanelSelectedImg + angle + '.png' + '?v=' + currentTime;
}

function getMapPicture() {
    if (shapesHandler.pvPanelSelected) {
        showProcessing(true);
        markerHandler.clearMarkerSelection();
        mapDataForm = shapesHandler.prepareAreasData();
        document.getElementById('markerDeleteButton').style.display = 'none';
        document.getElementById('drawShapeButton').style.display = 'none';
        document.getElementById('mapTypeSelect').style.display = 'none';
        // lock map moving
        map.setOptions({
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            draggable: false,
            scrollwheel: false,
            disableDoubleClickZoom: true,

        });
        drawingManager.setOptions({drawingControl: false});
        map.setOptions({styles: [{featureType: "all", elementType: "labels", stylers: [{visibility: "off"}]}]});

        shapesHandler.clearSelection();
        markerHandler.clearMarkerSelection();
        setTimeout(function () {
            html2canvas(document.querySelector('#map'), {
                backgroundColor: null,
                useCORS: true
            }).then(canvas => {
                imageUrl = canvas.toDataURL();
                moveToForm();
            });
        }, 1300);
    } else {
        alert('Please select a PV panel type');
    }
}

function convertToGoogleMapsPolygonPath(coordsObj) {
    const path = [];
    for (const key in coordsObj) {
        if (coordsObj.hasOwnProperty(key)) {
            const point = coordsObj[key];
            const latLng = {lat: point[0], lng: point[1]};
            path.push(latLng);
        }
    }
    return path;
}

function addMapyCzAttribution() {
    // Create and add the Mapy.cz logo
    const logo = document.createElement('a');
    logo.id = 'mapyCzLogo';
    logo.href = 'https://mapy.cz/';
    logo.target = '_blank';

    // Create and add the Mapy.cz logo image
    const logoImg = document.createElement('img');
    logoImg.src = 'https://api.mapy.cz/img/api/logo.svg';
    logoImg.alt = 'Mapy.cz logo';
    logoImg.style.height = '28px';
    logo.appendChild(logoImg);
    map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(logo);

    // Add the Mapy.cz attribution link
    var attributionControl = document.querySelectorAll('.gm-style-cc');
    if (attributionControl.length >= 2 && attributionControl[1].children.length >= 2) {
        var secondChild = attributionControl[1].children[1];
        var attributionLink = document.createElement('a');
        attributionLink.id = 'mapyCzCopyright';
        attributionLink.textContent = ' | \u00A9 Seznam.cz a.s. a další';
        attributionLink.setAttribute('href', 'https://api.mapy.cz/copyright');
        attributionLink.setAttribute('target', '_blank');
        attributionLink.style = "text-decoration: none; cursor: pointer; color: rgb(0, 0, 0);";
        secondChild.appendChild(attributionLink);
    }
}

function removeMapyCzAttribution() {
    const logo = document.getElementById('mapyCzLogo');
    const attribution = document.getElementById('mapyCzCopyright');
    if (logo) logo.remove();
    if (attribution) attribution.remove();
}

function loadMapData() {
    if (mapData.latitude && mapData.longitude) {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: mapData.latitude,
                lng: mapData.longitude
            },
            mapTypeId: 'satellite',
            zoom: mapData.zoom,
            tilt: 0,
            rotateControl: false,
        });
        let index = 0;
        mapData.areasData.forEach(function (area) {
            let polygon = new google.maps.Polygon({
                paths: convertToGoogleMapsPolygonPath(area.polygon),
                strokeColor: '#0033ff',
                draggable: false,
                editable: false,
            });
            polygon.setMap(map);
            google.maps.event.addListener(polygon, 'click', function () {
                shapesHandler.selectShape(polygon);
            });
            shapesHandler.addShape(polygon);
            addControlPanel();
        });
        areasObjects.forEach(function (areaData) {
            console.error('areaData', areaData);
            updateControlPanelTitle(areaData.title, index);
            updateControlPanelSlope(areaData.slope, index);
            updateControlPanelMountingPosition(areaData.mounting_position, index);
            index++;
        });
        mapDataLoaded = true;
    } else {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: latitude, lng: longitude}, zoom: 18, tilt: 0, rotateControl: false, mapTypeId: 'satellite',
        });
    }

    const deleteButton = document.createElement('button');
    deleteButton.id = 'markerDeleteButton';
    deleteButton.classList.add('btn', 'btn-danger');
    deleteButton.addEventListener('click', function () {
        let selectedMarkerKey = Object.keys(markerHandler.markers).find(key => markerHandler.markers[key].includes(markerHandler.selectedMarker));
        markerHandler.deleteMarker(selectedMarkerKey);
        deleteButton.style.display = 'none';
    });
    // add padding to the button
    deleteButton.style.marginRight = '10px';
    const deleteButtonIcon = document.createElement('i');
    deleteButtonIcon.classList.add('bi', 'bi-trash');
    deleteButton.appendChild(deleteButtonIcon);

    // Add the custom button to the map
    map.controls[google.maps.ControlPosition.RIGHT].push(deleteButton);
    deleteButton.style.display = 'none';

    const drawShapeButton = document.createElement('button');
    drawShapeButton.id = 'drawShapeButton';
    drawShapeButton.classList.add('btn', 'btn-primary', 'btn-sm');
    drawShapeButton.innerText = 'New area';
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(drawShapeButton);
    drawShapeButton.style.display = 'block';
    drawShapeButton.style.margin = '10px';

    drawShapeButton.addEventListener('click', function () {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    });

    createMapTypeSelect(map);
    clearHighlight();
    return map;
}

function createMapTypeSelect(map, googleOnly = false) {
    const mapTypeSelect = document.createElement('select');
    mapTypeSelect.id = 'mapTypeSelect';
    mapTypeSelect.classList.add('map-type-select', 'form-select', 'form-select-sm');

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Map';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    mapTypeSelect.appendChild(placeholderOption);

    const satelliteOption = document.createElement('option');
    satelliteOption.value = 'satellite';
    satelliteOption.textContent = 'Satellite';
    mapTypeSelect.appendChild(satelliteOption);

    if (!googleOnly) {
        const mapyCzOption = document.createElement('option');
        mapyCzOption.value = 'mapyCz';
        mapyCzOption.textContent = 'Mapy.cz';
        mapTypeSelect.appendChild(mapyCzOption);
    }

    const classicMapOption = document.createElement('option');
    classicMapOption.value = 'roadmap';
    classicMapOption.textContent = 'Road Map';
    mapTypeSelect.appendChild(classicMapOption);

    map.controls[google.maps.ControlPosition.LEFT_TOP].push(mapTypeSelect);
    mapTypeSelect.style.width = '77px';
    mapTypeSelect.style.marginLeft = '10px';
    if (googleOnly) {
        mapTypeSelect.style.marginTop = '10px';
    }

    mapTypeSelect.addEventListener('change', function () {
        const selectedMapType = this.value;
        map.setMapTypeId(selectedMapType);
        if (!googleOnly) {
            if (selectedMapType === 'mapyCz') {
                if (!mapAttribution) {
                    addMapyCzAttribution();
                    mapAttribution = true;
                }
            } else {
                removeMapyCzAttribution();
                mapAttribution = false;
            }
        }
        this.selectedIndex = 0;
    });
}