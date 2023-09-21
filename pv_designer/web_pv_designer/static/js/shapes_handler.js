var selectedShape;
var shapes = [];


function clearSelection() {
    if (selectedShape) {
        selectedShape.setEditable(false);
        selectedShape.setDraggable(false);
        selectedShape = null;
    }
}

function clearSelectionAndHighlight() {
    if (selectedShape) {
        selectedShape.setEditable(false);
        selectedShape.setDraggable(false);
        selectedShape = null;
        clearHighlight();
    }
}

function selectShape(shape) {
    clearSelection();
    selectedShape = shape;
    const index = shapes.indexOf(shape);
    selectControlPanel(index);
    shape.setEditable(true);
    shape.setDraggable(true);
}

function rotateSelectedShape() {
    if (selectedShape) {
        selectedShape = rotatePolygon(selectedShape);
    }
}

function deleteShape() {
    if (confirm("Are you sure you want to delete this area?")) {
        if (selectedShape) {
            selectedShape.setMap(null); // Remove shape from the map
            const index = shapes.indexOf(selectedShape);
            deleteControlPanel(index);
            if (index !== -1) {
                shapes.splice(index, 1); // Remove shape from the shapes array
            }
            selectedShape = null;
        }
    }
}

function fillAreaWithPanels() {
    if (selectedShape) {
        const index = shapes.indexOf(selectedShape);
        clearMarkers(index);
        const data = fillPolygon(shapes.indexOf(selectedShape));
        const area = google.maps.geometry.spherical.computeArea(selectedShape.getPath());
        const p = document.getElementById("panelCount" + (index + 1));
        p.textContent = data.panelsCount;
        const a = document.getElementById("azimuth" + (index + 1));
        a.textContent = data.azimuth;
    }
}

function prepareAreasData(){
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const area = google.maps.geometry.spherical.computeArea(shape.getPath());
        const panelCount = document.getElementById("panelCount" + (i + 1)).textContent;
        const azimuth = document.getElementById("azimuth" + (i + 1)).textContent;
        let slope = document.getElementById("slope" + (i + 1)).textContent;
        const title = document.getElementById("title" + (i + 1)).textContent;
        console.log('slope: ' + title);
        if(slope === ''){
            slope = 0;
        }
        const shapeData = {
            'type': 'polygon',
            'area': area,
            'panelsCount': panelCount,
            'azimuth': azimuth,
            'slope': slope,
            'title': title,
        };
        console.log(shapeData);
        shapesData.push(shapeData);
        }
}
