class Shape {
    constructor(shape, index, panelHeight, panelWidth) {
        this.isSelected = false;
        this.shape = shape;
        this.index = index;
        this.panelHeight = panelHeight;
        this.panelWidth = panelWidth;
        this.panelCount = 0;
        this.azimuth = 0;
    }

    rotateSelectedShape() {
        if (this.isSelected) {
            this.shape = rotatePolygon(this.shape);
        }
    }
    getShape() {
        return this.shape;
    }
    setPath(path) {
        this.shape.setPath(path);
    }
    deleteShape() {
        if (this.isSelected) {
            this.shape.setMap(null);
        }
    }

    clearSelection() {
        if (this.isSelected) {
            this.shape.setEditable(false);
            this.shape.setDraggable(false);
            this.isSelected = false;
        }
    }

    selectShape() {
        this.isSelected = true;
        this.shape.setEditable(true);
        this.shape.setDraggable(true);
    }

    isSameShape(shape) {
        return this.shape === shape;
    }

}


