let selectedMarker;

function clearMarkers() {
    markers.forEach(function (marker) {
        marker.setMap(null);
    });
    markers = [];
}

function putMarker(markerPosition, markerIcon, angle) {
    angle = angle + '';
    setTimeout(function () {
        const marker = new google.maps.Marker({
            position: markerPosition,
            map: map,
            icon: markerIcon,
            title: angle,
        });
        markers.push(marker);
        google.maps.event.addListener(marker, 'click', function () {
            selectMarker(marker);
        });
    }, 200);
}

function getMarkerPicture(position, imgUrl, angle) {
    const angleAbs = Math.abs(angle);
    const panelWidthPix = calculatePixelSize(map, panelWidth, position.lat());
    const panelHeightPix = calculatePixelSize(map, panelHeight, position.lat());
    const rotatedPanelWidth = panelWidthPix * Math.cos(angleAbs * Math.PI / 180) + panelHeightPix * Math.sin(angleAbs * Math.PI / 180);
    const rotatedPanelHeight = panelWidthPix * Math.sin(angleAbs * Math.PI / 180) + panelHeightPix * Math.cos(angleAbs * Math.PI / 180);
    let anchorY = panelWidthPix * Math.sin(angleAbs * Math.PI / 180);
    let anchorX = panelHeightPix * Math.sin(angleAbs * Math.PI / 180);

    console.log('angle: ' + angle + ' angleABS: ' + angleAbs);
    if (angle > 0) {
        anchorX = 0;
    } else {
        anchorY = 0;
    }
    return {
        url: imgUrl,
        scaledSize: new google.maps.Size(rotatedPanelWidth, rotatedPanelHeight),
        anchor: new google.maps.Point(anchorX, anchorY),
    };
}

function selectMarker(marker) {
    clearMarkerSelection();
    selectedMarker = marker;
    marker.setDraggable(true);
    console.log('title:' + marker.title);
    marker.setIcon(getMarkerPicture(marker.getPosition(), getPvImgSelectedUrl(marker.title), marker.title));
}

function clearMarkerSelection() {
    if (selectedMarker) {
        selectedMarker.setDraggable(false);
        selectedMarker.setIcon(getMarkerPicture(selectedMarker.getPosition(), getPvImgUrl(selectedMarker.title), selectedMarker.title));
        selectedMarker = null;
    }
}

function deleteMarker() {
    if (selectedMarker) {
        selectedMarker.setMap(null); // Remove shape from the map
        const index = markers.indexOf(selectedMarker);
        if (index !== -1) {
            markers.splice(index, 1); // Remove shape from the shapes array
        }
        selectedMarker = null;
    }
}

function isPanelInPolygon(leftTop, polygon, notFirstLine, headingLTR, headingRTD) {
    let panelLeftTop = leftTop;
    console.log(headingLTR, headingRTD);
    let panelRightTop = google.maps.geometry.spherical.computeOffset(panelLeftTop, panelWidth, headingLTR);
    let panelRightBottom = google.maps.geometry.spherical.computeOffset(panelRightTop, panelHeight, headingRTD);
    let isLeftTop = google.maps.geometry.poly.containsLocation(panelLeftTop, polygon);
    let isRightBottom = google.maps.geometry.poly.containsLocation(panelRightBottom, polygon);
    let isRightTop = true;
    if (notFirstLine) {
        isRightTop = google.maps.geometry.poly.containsLocation(panelRightTop, polygon);
    }
    return !!(isLeftTop && isRightBottom && isRightTop);
}

function addSubpanel() {
    const subpanelsContainer = document.getElementById("areaControlPanels");
    const newSubpanel = document.createElement("div");
    const areaIndex = subpanelsContainer.querySelectorAll(".col-md.subpanel").length + 1;
    newSubpanel.className = "col-md subpanel";
    newSubpanel.style.maxWidth = "50%";
    newSubpanel.innerHTML = `
                <div class="card" onclick="highlightPanel(this)">
                    <div class="card-body">
                        <h5 class="card-title" ondblclick="makeTitleEditable(this)">Area ${areaIndex}</h5>
                        <!-- Input for slope -->
                        <div class="input-group mt-3" style="padding-bottom: 10px">
                            <label class="input-group-text" for="roofSlopeInput">Slope (°)</label>
                            <input class="form-control" type="number" min="0" max="90" id="roofSlopeInput" placeholder="Enter slope">
                        </div>
                        <!-- Buttons for additional actions -->
                        <button class="btn btn-primary">Fill with panels</button>
                        <button class="btn btn-primary" onclick="rotateSelectedShape()">Rotate polygon</button>
                        <button class="btn btn-danger" onclick="deleteShape()">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;

    // Append the new subpanel to the container
    subpanelsContainer.appendChild(newSubpanel);
}

function deleteSubpanel(index) {
    clearSelection();
    console.log(index + 'deleteSubpanel');
    const subpanelsContainer = document.getElementById("areaControlPanels");
    const subpanels = subpanelsContainer.querySelectorAll(".col-md.subpanel");

    if (index >= 0 && index < subpanels.length) {
        subpanels[index].remove();
    }
}


function highlightPanel(panel) {
    // Remove the "highlight" class from all subpanels
    const allPanels = document.querySelectorAll(".card");
    allPanels.forEach((p) => {
        p.classList.remove("highlight");
    });

    // Add the "highlight" class to the clicked subpanel
    panel.classList.add("highlight");

    // Get the index of the clicked subpanel
    const index = Array.from(allPanels).indexOf(panel);
    console.log(index);
    if (index >= 0) {
        selectShape(shapes[index]);
    }

    // Disable buttons on other subpanels
    const allButtons = document.querySelectorAll(".card-body button");
    allButtons.forEach((b) => {
        b.disabled = false;
    });
}

function selectSubpanel(index) {
    const subpanels = document.querySelectorAll(".card");
    const subpanel = subpanels[index];
    subpanel.click();
}

function clearHighlight() {
    console.log('clearHighlight');
    // clear all highlights
    const allPanels = document.querySelectorAll(".card");
    allPanels.forEach((p) => {
        p.classList.remove("highlight");
    });
}

function makeTitleEditable(titleElement) {
            titleElement.contentEditable = true;
            titleElement.classList.add("editable-title");

            // Focus on the editable title element
            titleElement.focus();

            // Handle the blur event (when the title loses focus)
            titleElement.addEventListener("blur", function () {
                titleElement.contentEditable = false;
                titleElement.classList.remove("editable-title");
            });
        }