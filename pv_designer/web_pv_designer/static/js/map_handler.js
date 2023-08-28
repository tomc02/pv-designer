var map;
var drawingManager;
var selectedShape;
var shapes = [];
var panelWidth = 1.1;
var panelHeight = 2.1;
var markers = [];

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
        shapes.push(shape);
        google.maps.event.addListener(shape, 'click', function () {
            selectShape(shape);
        });
        drawingManager.setDrawingMode(null);
        selectShape(shape);
    });

    google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);

    google.maps.event.addListener(map, 'click', clearSelection);
    searchBoxInit(map);
    google.maps.event.addDomListener(document, 'keyup', function (e) {
        const code = (e.keyCode ? e.keyCode : e.which);
        if (code === 46) {
            deleteShape();
        }
    });
}

function clearSelection() {
    if (selectedShape) {
        selectedShape.setEditable(false);
        selectedShape.setDraggable(false);
        selectedShape = null;
    }
}

function selectShape(shape) {
    clearSelection();
    selectedShape = shape;
    shape.setEditable(true);
    shape.setDraggable(true);
}
function rotateSelectedShape() {
    if (selectedShape) {
      selectedShape = rotatePolygon(selectedShape);
    }
}
function deleteShape() {
    if (selectedShape) {
        selectedShape.setMap(null); // Remove shape from the map
        const index = shapes.indexOf(selectedShape);
        if (index !== -1) {
            shapes.splice(index, 1); // Remove shape from the shapes array
        }
        selectedShape = null;
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
