class Shape {
    constructor(shape, index, panelHeight, panelWidth) {
        this.isSelected = false;
        this.shape = shape;
        this.index = index;
        this.panelHeight = panelHeight;
        this.panelWidth = panelWidth;
        this.panelCount = 0;
        this.azimuth = 0;
        this.slope = 0;
        this.mountingType = 'roof';
        this.rotations = 0;

    }

    rotateShape() {
        rotatePolygon(this.shape);
        this.rotations++;
        if (this.rotations === 4) {
            this.rotations = 0;
        }
    }

    getShape() {
        return this.shape;
    }

    setPath(path) {
        this.shape.setPath(path);
        console.log('setPath');
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

    setSlope(slope) {
        this.slope = slope;
    }

    setMountingPosition(position) {
        this.mountingType = position;
    }

    getSlope() {
        return this.slope;
    }

}


