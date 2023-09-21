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

function fillAreaWithPanels(){
    if(selectedShape){
        const data = fillPolygon(shapes.indexOf(selectedShape));
        const index = shapes.indexOf(selectedShape) + 1;
        const p = document.getElementById("panelCount" + index);
        p.textContent= data.panelsCount;
    }
}