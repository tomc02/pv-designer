class Shape {
    constructor(shape, index, panelHeight, panelWidth) {
        this.isSelected = false;
        this.shape = shape;
        this.index = index;
        this.panelHeight = panelHeight;
        this.panelWidth = panelWidth;
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


