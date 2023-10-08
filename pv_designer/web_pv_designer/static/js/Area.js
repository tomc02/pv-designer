class Area {
    constructor(shape, index) {
        this.isSelected = false;
        this.shape = shape;
        this.index = index;
    }

    clearSelection() {
        if (this.isSelected) {
            this.shape.setEditable(false);
            this.shape.setDraggable(false);
            this.isSelected = false;
            selectedShape = null;
        }
    }

    clearSelectionAndHighlight() {
        if (this.isSelected) {
            this.shape.setEditable(false);
            this.shape.setDraggable(false);
            this.isSelected = false;
            selectedShape = null;
            clearHighlight();
        }
    }

    selectShape() {
        this.clearSelection();
        this.isSelected = true;
        selectControlPanel(this.index);
        this.shape.setEditable(true);
        this.shape.setDraggable(true);
        selectedShape = this.index;
    }

    rotateSelectedShape() {
        if (this.isSelected) {
            this.shape = rotatePolygon(this.shape); // You should define the rotatePolygon function elsewhere.
        }
    }

    deleteShape() {
        if (confirm("Are you sure you want to delete this area?")) {
            if (this.isSelected) {
                this.shape.setMap(null);
                deleteControlPanel(this.index); // You should define the deleteControlPanel function elsewhere.
                selectedShape = null;
                delete this;
            }
        }
    }

    fillAreaWithPanels() {
        if (this.selectedShape) {
            const index = this.shapes.indexOf(this.selectedShape);
            markerHandler.clearMarkers(index); // You should define the markerHandler object elsewhere.
            const data = fillPolygon(this.shapes.indexOf(this.selectedShape)); // You should define the fillPolygon function elsewhere.
            const area = google.maps.geometry.spherical.computeArea(this.selectedShape.getPath());
            const p = document.getElementById("panelCount" + (index + 1));
            p.textContent = data.panelsCount;
            const a = document.getElementById("azimuth" + (index + 1));
            a.textContent = data.azimuth;
        }
    }

    prepareAreasData() {
        const shapesData = [];
        for (let i = 0; i < this.shapes.length; i++) {
            const shape = this.shapes[i];
            const area = google.maps.geometry.spherical.computeArea(shape.getPath());
            const panelCount = document.getElementById("panelCount" + (i + 1)).textContent;
            const azimuth = document.getElementById("azimuth" + (i + 1)).textContent;
            let slope = document.getElementById("slope" + (i + 1)).textContent;
            const title = document.getElementById("title" + (i + 1)).textContent;
            console.log('slope: ' + title);
            if (slope === '') {
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
        return shapesData;
    }
}
