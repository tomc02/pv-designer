function takeshot() {
    html2canvas(document.querySelector('#map')).then(function (canvas) {
        // Convert canvas to a data URL
        var dataUrl = canvas.toDataURL();

        // Create a temporary link element
        var downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = 'screenshot.png'; // Specify the filename

        // Trigger a click on the link to start the download
        downloadLink.click();
    });
}

function takeScreenshot() {
    // Set the center and zoom of the static image to match the current map view
    const center = map.getCenter();
    const zoom = map.getZoom();

    var mapContainer = $('#map');
    var sizex = mapContainer.width();
    var sizey = mapContainer.height();
    // Construct the URL for the static image
    let staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat()},${center.lng()}&zoom=${zoom}&size=${sizex}x${sizey}&maptype=satellite`;

    // Add markers and shapes to the static image URL
    shapes.forEach(function (shape) {
        if (shape instanceof google.maps.Marker) {
            const position = shape.getPosition();
            staticMapUrl += `&markers=color:red%7Clabel:M%7C${position.lat()},${position.lng()}`;
        } else if (shape instanceof google.maps.Polygon) {
            const path = encodePolygon(shape);
            staticMapUrl += `&path=fillcolor:0x00000033%7Ccolor:0x0000FF80%7C${path}`;
        }
    });
    // Add markers to the static image URL
    markers.forEach(function (marker) {
        const position = marker.getPosition();
        // Marker must be pv panel picture

        //staticMapUrl += `&markers=color:red%7Clabel:M%7C${position.lat()},${position.lng()}`;
    });
    // Add the API key to the static map URL
    staticMapUrl += `&key=AIzaSyDvX9ndMncH71GBqL-w0wOW9tyPbhgXPlQ`;

    // Display the static map URL for debugging purposes
    console.log(staticMapUrl);
}

function encodePolygon(polygon) {
    var path = polygon.getPath().getArray().map(point => `${point.lat()},${point.lng()}`).join('|');
    const firstPoint = polygon.getPath().getAt(0);
    const lastPoint = polygon.getPath().getAt(polygon.getPath().getLength() - 1);
    if (!firstPoint.equals(lastPoint)) {
        // Add the first point at the end to close the polygon
        path += `|${firstPoint.lat()},${firstPoint.lng()}`;
    }
    return encodeURIComponent(path);
}
