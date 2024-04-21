var map;
var simpleMap;
var homeLocationMarker;
var drawingManager;

function initMap() { // Called by Google Maps api callback
    map = loadMapData();
    drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: true, drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER, drawingModes: ['polygon'],
        }, polygonOptions: {
            editable: true, draggable: true, strokeColor: '#0033ff', zIndex: 10,
        },
    });
    drawingManager.setMap(map);

    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
        const shape = event.overlay;
        // if shape has 4 points
        if (shape.getPath().getLength() == 4 || shape.getPath().getLength() == 3) {
            if (shapesHandler.shapesCount < 10) {
                addControlPanel();
                shapesHandler.addShape(shape);
                google.maps.event.addListener(shape, 'click', function () {
                    shapesHandler.selectShape(shape);
                });
                drawingManager.setDrawingMode(null);
                shapesHandler.selectShape(shape);
                addInsertPointListener(shape);
            } else {
                shape.setMap(null);
                alert('You can draw only 10 areas');
            }
        } else {
            shape.setMap(null);
            alert('Area must have only 4 points');
        }
    });

    google.maps.event.addListener(drawingManager, 'drawingmode_changed', shapesHandler.clearSelection);

    google.maps.event.addListener(map, 'click', function (event) {
        markerHandler.clearMarkerSelection();
        shapesHandler.clearSelectionAndHighlight();
    });


    searchBoxInit(map);
    google.maps.event.addDomListener(document, 'keyup', function (e) {
        const code = (e.keyCode ? e.keyCode : e.which);
        if (code === 46) {
            shapesHandler.deleteShape();
        }
    });

    // add listener for map zoom change
    google.maps.event.addListener(map, 'zoom_changed', function () {
        shapesHandler.fillAllAreasWithPanels(true);
    });

    if (mapDataLoaded) {
        google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
            let index = 0;
            shapesHandler.fillAllAreasWithPanels();
            console.log('mapData.areasObjects', mapData.areasObjects);
            mapData.areasData.forEach(function (areaData) {
                shapesHandler.rotateShapeByIndex(index, areaData.rotations);
                index++;
            });
            refreshAllSlopes();
            setTimeout(function () {
                shapesHandler.fillAllAreasWithPanels();
            }, 500);
        });
    }

    var mapyCzType = new google.maps.ImageMapType({
        getTileUrl: function (coord, zoom) {
            return `/mapy-cz-tiles/${zoom}/${coord.x}/${coord.y}/`
        }, tileSize: new google.maps.Size(256, 256), maxZoom: 20, name: 'Mapy.cz', alt: 'Show Mapy.cz layer'
    });
    map.mapTypes.set('mapyCz', mapyCzType);


    map.setOptions({streetViewControl: false});
    map.setOptions({mapTypeControl: false});

}

function searchBoxInit(map, putMarker = false) {
    // Create the search box and link it to the UI element.
    const input = document.getElementById("searchInput");
    const searchBox = new google.maps.places.SearchBox(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener("bounds_changed", () => {
        searchBox.setBounds(map.getBounds());
    });

    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }
        const bounds = new google.maps.LatLngBounds();
        places.forEach((place) => {
            if (!place.geometry || !place.geometry.location) {
                console.log("Returned place contains no geometry");
                return;
            }
            const icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25),
            };
            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);

        map.setZoom(19);
        if (putMarker) {
            setHomeLocationMarker(simpleMap.getCenter().lat(), simpleMap.getCenter().lng());
        }
    });

    const searchButton = document.getElementById('searchButton');
    searchButton.addEventListener('click', function () {
        const placesService = new google.maps.places.PlacesService(map);
        const query = input.value;
        if (!query) {
            return;
        }
        placesService.findPlaceFromQuery({
            query: query,
            fields: ['name', 'geometry'],
        }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const bounds = new google.maps.LatLngBounds();
                results.forEach((place) => {
                    if (!place.geometry || !place.geometry.location) {
                        console.log("Returned place contains no geometry");
                        return;
                    }
                    if (place.geometry.viewport) {
                        bounds.union(place.geometry.viewport);
                    } else {
                        bounds.extend(place.geometry.location);
                    }
                });

                map.fitBounds(bounds);
                map.setZoom(19);

                if (putMarker) {
                    setHomeLocationMarker(simpleMap.getCenter().lat(), simpleMap.getCenter().lng());
                }
            } else {
                console.error('Place search did not return any results.');
            }
        });
    });
}


function setHomeLocationMarker(lat, lng) {
    if (homeLocationMarker) {
        homeLocationMarker.setMap(null);
    }
    console.log('setting marker', lat, lng);
    homeLocationMarker = new google.maps.Marker({
        position: {lat: lat, lng: lng}, map: simpleMap, draggable: true,
    });

    document.getElementById('id_latitude').value = lat;
    document.getElementById('id_longitude').value = lng;
}

function addInsertPointListener(shape) {
    google.maps.event.addListener(shape.getPath(), 'insert_at', function (index) {
        shape.getPath().removeAt(index);
        alert('Area can have only 4 points');
    });
}

function initSimpleMap(locked = false, lat, lng) {
    simpleMap = new google.maps.Map(document.getElementById('simple_map'), {
        center: {
            lat: lat, lng: lng
        },
        mapTypeId: 'satellite',
        zoom: 19,
        draggable: !locked,
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: locked,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        tilt: 0,
        rotateControl: false,
    });
    if (!locked) {
        createMapTypeSelect(simpleMap,true);
    }
    // place home location marker to the center of the map
    homeLocationMarker = new google.maps.Marker({
        position: {lat: lat, lng: lng}, map: simpleMap, draggable: !locked,
    });

    //set listener for click on map to add marker
    if (!locked) {
        google.maps.event.addListener(simpleMap, 'click', function (event) {
            setHomeLocationMarker(event.latLng.lat(), event.latLng.lng());
        });
    }
}

function updateMapMessage(hasLocation) {
    const messageElement = document.getElementById('map-message');
    if (hasLocation) {
        messageElement.innerHTML = '';
    } else {
        messageElement.innerHTML = '<p class="text-warning">Update your account to set your home location.</p>';
    }
}

function updateAccountInit(){ // Called by Google Maps api callback
    initSimpleMap(false, lat, lng);
    searchBoxInit(simpleMap, true);
}

function accountDetailsInit() { // Called by Google Maps api callback
    if (user_location !== "None") {
        const matches = user_location.match(/POINT \(([^ ]+) ([^ ]+)\)/);
        if (matches && matches.length === 3) {
            const longitude = parseFloat(matches[1]);
            const latitude = parseFloat(matches[2]);
            updateMapMessage(true);
            initSimpleMap(true, latitude, longitude);
        }
    } else {
        updateMapMessage(false);
        const simpleMap = document.getElementById('simple_map');
        if (simpleMap) {
            simpleMap.style.display = 'none';
        }
    }
}