class ShapesHandler {
    constructor() {
        this.selectedShape = null;
        this.selectedShapeIndex = null;
        this.shapes = [];
        this.shapesObjects = [];
        this.shapesCount = 0;
        this.panelH = 1.75;
        this.panelW = 1.15;
    }

    getShape(index) {
        console.log('getShape: ' + index)
        return this.shapesObjects[index].getShape();
    }

    setPath(index, path) {
        this.shapesObjects[index].setPath(path);
    }

    getPanelHeight(index = this.selectedShapeIndex) {
        console.log('getPanelHeight: ' + index)
        return this.shapesObjects[index].panelHeight;
    }

    getPanelWidth(index = this.selectedShapeIndex) {
        console.log('getPanelWidth: ' + index)
        return this.shapesObjects[index].panelWidth;
    }

    recalculatePanelHeight(index, slope) {
        slope = 90 - slope;
        this.shapesObjects[index].panelHeight = this.panelH * Math.sin(slope * Math.PI / 180);
    }

    addShape(shape) {
        const index = this.shapes.length;
        const newShape = new Shape(shape, index, this.panelH, this.panelW);
        this.shapesObjects.push(newShape);
        this.shapes.push(shape);
        this.shapesCount++;
    }

    clearSelection() {
        if (this.selectedShape) {
            this.selectedShape.clearSelection();
            this.selectedShape = null;
            this.selectedShapeIndex = null;
        }
    }

    clearSelectionAndHighlight() {
        if (this.selectedShape) {
            this.selectedShape.clearSelection();
            this.selectedShape = null;
            this.selectedShapeIndex = null;
            clearHighlight();
        }
    }
    selectShapeByIndex(index) {
        const shape = this.shapesObjects[index].getShape();
        this.selectShape(shape);
    }
    selectShape(shape) {
        this.clearSelection();
        for (let i = 0; i < this.shapesObjects.length; i++) {
            const s = this.shapesObjects[i];
            if (s.isSameShape(shape)) {
                this.selectedShape = s;
                selectControlPanel(i);
                this.selectedShape.selectShape();
                this.selectedShapeIndex = i;
            }
        }
    }

    rotateSelectedShape() {
        if (this.selectedShape) {
            this.selectedShape.rotateSelectedShape();
        }
    }

    deleteShape() {
        if (confirm("Are you sure you want to delete this area?")) {
            if (this.selectedShape) {
                const index = this.selectedShapeIndex;
                this.selectedShape.deleteShape();
                deleteControlPanel(index);
                markerHandler.clearMarkers(index);
                this.shapes.splice(index, 1);
                this.shapesObjects.splice(index, 1);
                this.shapesCount--;
                this.selectedShape = null;
                this.selectedShapeIndex = null;
            }
        }
    }

    fillAreaWithPanels() {
        if (this.selectedShape) {
            markerHandler.clearMarkers(this.selectedShapeIndex);
            const data = fillPolygon(this.selectedShapeIndex);
            const area = google.maps.geometry.spherical.computeArea(this.selectedShape.getShape().getPath());
            const p = document.getElementById("panelCount" + (this.selectedShapeIndex + 1));
            p.textContent = data.panelsCount;
            const a = document.getElementById("azimuth" + (this.selectedShapeIndex + 1));
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

