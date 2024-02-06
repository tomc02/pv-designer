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
        this.isFilled = false;
        this.highlightedEdge = null;
        this.dragging = false;
        this.listenerSet = false;
        this.orientation = 0;
    }

    rotateShape() {
        rotatePolygon(this);
        this.updateHighlightedEdge();
        this.rotations++;
        if (this.rotations === 4) {
            this.rotations = 0;
        }
    }

    updateHighlightedEdge() {
        if (this.highlightedEdge) {
            this.highlightedEdge.setMap(null);
        }
        this.highlightedEdge = new google.maps.Polyline({
            path: [this.shape.getPath().getAt(0), this.shape.getPath().getAt(1)],
            strokeColor: '#FF0000',
            strokeOpacity: 2.0,
            strokeWeight: 6,
            map: map,
            zIndex: 1000,
            title: this.index,
        });
    }

    getShape() {
        return this.shape;
    }

    getPath() {
        return this.shape.getPath();
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

    changeOrientation() {
        this.orientation = this.orientation === 0 ? 1 : 0;
        const tmp = this.panelHeight;
        this.panelHeight = this.panelWidth;
        this.panelWidth = tmp;
    }

}


