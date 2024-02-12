class ShapesHandler {
    constructor(panelHeight, panelWidth) {
        this.selectedShape = null;
        this.selectedShapeIndex = null;
        this.shapes = [];
        this.shapesObjects = [];
        this.shapesCount = 0;
        this.panelH = panelHeight;
        this.panelW = panelWidth;
        this.dragging = false;
        this.pvPanelSelected = false;
    }

    getShapeObject(index) {
        return this.shapesObjects[index];
    }

    getShape(index) {
        return this.shapesObjects[index].getShape();
    }

    setPath(index, path) {
        this.shapesObjects[index].setPath(path);
    }

    getPanelHeight(index = this.selectedShapeIndex) {
        return this.shapesObjects[index].panelHeight;
    }

    getPanelWidth(index = this.selectedShapeIndex) {
        return this.shapesObjects[index].panelWidth;
    }

    recalculatePanelHeight(index, slope) {
        const shape = this.shapesObjects[index];
        slope = 90 - slope;
        if (shape.orientation) {
            shape.panelHeight = this.panelW * Math.sin(slope * Math.PI / 180);
            shape.panelWidth = this.panelH;
        } else {
            shape.panelHeight = this.panelH * Math.sin(slope * Math.PI / 180);
            shape.panelWidth = this.panelW;
        }
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

    rotateSelectedShape(rotationsCount = 1) {
        if (this.selectedShape) {
            console.log('rotateSelectedShape ' + rotationsCount + ' times');
            for (let i = 0; i < rotationsCount; i++) {
                this.selectedShape.rotateShape();
            }
            this.fillAreaWithPanels();
        }
    }

    rotateShapeByIndex(index, rotationsCount = 1) {
        if (this.shapes[index]) {
            console.log('rotateShape ' + rotationsCount + ' times');
            for (let i = 0; i < rotationsCount; i++) {
                this.shapesObjects[index].rotateShape();
            }
            this.fillAreaWithPanels();
        }
    }

    clearFilledPanels() {
        if (this.selectedShape) {
            markerHandler.clearMarkers(this.selectedShapeIndex);
        }
    }

    deleteShape() {
        if (confirm("Are you sure you want to delete this area?")) {
            if (this.selectedShape) {
                const index = this.selectedShapeIndex;
                this.selectedShape.deleteHighLightedEdge();
                markerHandler.deleteMarkersArea(index);
                this.selectedShape.deleteShape();
                deleteControlPanel(index);
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
            console.log('area: ' + this.selectedShapeIndex);
            const p = document.getElementById("panelCount" + (this.selectedShapeIndex));
            p.textContent = data.panelsCount;
            const a = document.getElementById("azimuth" + (this.selectedShapeIndex));
            a.textContent = data.azimuth;
            const shape = this.selectedShape;
            shape.panelsCount = data.panelsCount;
            shape.azimuth = data.azimuth;
            shape.isFilled = true;
        }
    }

    fillAllAreasWithPanels(filledOnly = false) {
        for (let i = 0; i < this.shapesCount; i++) {
            this.selectShapeByIndex(i);
            if (!filledOnly) {
                this.fillAreaWithPanels();
            } else {
                if (this.selectedShape.isFilled) {
                    this.fillAreaWithPanels();
                }
            }
            setTimeout(function () {
            }, 50);
        }
    }

    prepareAreasData() {
        const shapesData = [];
        for (let i = 0; i < this.shapes.length; i++) {
            const shape = this.shapes[i];
            const shapeObject = this.shapesObjects[i];
            const area = google.maps.geometry.spherical.computeArea(shape.getPath());
            const panelCount = document.getElementById("panelCount" + (i)).textContent;
            const azimuth = document.getElementById("azimuth" + (i)).textContent;
            let slope = document.getElementById("slope" + (i)).value;
            const title = document.getElementById("title" + (i)).textContent;
            const mountingPosition = document.getElementById("mountingPosition" + (i)).value;
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
                'mountingType': mountingPosition,
                'rotations': shapeObject.rotations,
            };
            console.log(shapeData);
            shapesData.push(shapeData);
        }
        return shapesData;
    }

    changePanelsOrientation() {
        this.selectedShape.changeOrientation();
        this.fillAreaWithPanels();
    }
}


