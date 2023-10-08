class ShapesHandler {
    constructor() {
        this.selectedShape = null;
        this.shapes = [];
        this.shapesCount = 0;
        this.panelH = 1.75;
        this.panelW = 1;
    }

    addShape(shape) {
        const index = this.shapes.length;
        const newShape = new Shape(shape, index, this.panelH, this.panelW);
        this.shapes.push(newShape);
    }
    clearSelection() {
        if (this.selectedShape) {
            this.selectedShape.clearSelection();
            this.selectedShape = null;
        }
    }

    clearSelectionAndHighlight() {
        if (this.selectedShape) {
            this.selectedShape.clearSelection();
            this.selectedShape = null;
            clearHighlight();
        }
    }

    selectShape(shape) {
        let index = -1;
        this.clearSelection();
        for (let i = 0; i < this.shapes.length; i++) {
            if (this.shapes[i].isSameShape(shape)) {
                this.selectedShape = this.shapes[i];
                index = i;
                break;
            }
        }
        selectControlPanel(index);
        this.selectedShape.selectShape();
    }

    rotateSelectedShape() {
        if (this.selectedShape) {
            this.selectedShape = rotatePolygon(this.selectedShape); // You should define the rotatePolygon function elsewhere.
        }
    }

    deleteShape() {
        if (confirm("Are you sure you want to delete this area?")) {
            if (this.selectedShape) {
                this.selectedShape.setMap(null);
                const index = this.shapes.indexOf(this.selectedShape);
                deleteControlPanel(index); // You should define the deleteControlPanel function elsewhere.
                if (index !== -1) {
                    this.shapes.splice(index, 1);
                    markerHandler.clearMarkers(index);
                }
                this.selectedShape = null;
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

const shapesHandler = new ShapesHandler();

