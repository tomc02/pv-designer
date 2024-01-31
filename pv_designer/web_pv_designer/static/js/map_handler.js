var map;
var drawingManager;

function initMap() {
    map = loadMapData();
    drawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: true, drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER, drawingModes: [google.maps.drawing.OverlayType.POLYGON,],
        }, polygonOptions: {
            editable: true, draggable: true, strokeColor: '#0033ff',
        },
    });

    drawingManager.setMap(map);

    google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
        const shape = event.overlay;
        // if shape has 4 points
        if (shape.getPath().getLength() === 4) {
            if (shapesHandler.shapesCount < 4) {
                addControlPanel();
                shapesHandler.addShape(shape);
                google.maps.event.addListener(shape, 'click', function () {
                    shapesHandler.selectShape(shape);
                });
                drawingManager.setDrawingMode(null);
                shapesHandler.selectShape(shape);
                shapesHandler.selectedShape.updateHighlightedEdge();
                google.maps.event.addListener(shape.getPath(), 'set_at', function () {
                    shapesHandler.selectedShape.updateHighlightedEdge();
                    shapesHandler.clearFilledPanels();
                });
            } else {
                shape.setMap(null);
                alert('You can draw only 4 areas');
            }
        } else {
            shape.setMap(null);
            alert('You can draw only rectangles');
        }
    });

    google.maps.event.addListener(drawingManager, 'drawingmode_changed', shapesHandler.clearSelection);

    google.maps.event.addListener(map, 'click', function () {
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

    var drawButton = document.getElementById('drawShapeButton');
    // Add a click event listener to the button
    drawButton.addEventListener('click', function () {
        // Trigger a drawing mode on the map polygon
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    });

    // add listener for map zoom change
    google.maps.event.addListener(map, 'zoom_changed', function () {
        shapesHandler.fillAllAreasWithPanels(true);
    });

    if (mapDataLoaded) {
        google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
            let index = 0;
            shapesHandler.fillAllAreasWithPanels();
            mapData.areasData.forEach(function (areaData) {
                shapesHandler.rotateShapeByIndex(index, areaData.rotations);
                index++;
            });
            setTimeout(function () {
                refreshAllSlopes();
                shapesHandler.fillAllAreasWithPanels();
            }, 100);
        });
    }
}

function searchBoxInit(map) {
    // Create the search box and link it to the UI element.
    const input = document.getElementById("searchInput");
    const searchBox = new google.maps.places.SearchBox(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener("bounds_changed", () => {
        searchBox.setBounds(map.getBounds());
    });
    let markers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }

        // Clear out the old markers.
        markers.forEach((marker) => {
            marker.setMap(null);
        });
        markers = [];

        // For each place, get the icon, name and location.
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

            // Create a marker for each place.
            markers.push(new google.maps.Marker({
                map, icon, title: place.name, position: place.geometry.location,
            }),);
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);
    });
}
