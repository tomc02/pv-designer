function addControlPanel() {
    const subpanelsContainer = document.getElementById("areaControlPanels");
    const newSubpanel = document.createElement("div");
    const areaIndex = subpanelsContainer.querySelectorAll(".col-md.subpanel").length;
    newSubpanel.className = "subpanel col-sm-12 col-md";
    newSubpanel.innerHTML = `
                <div class="card" onclick="highlightControlPanel(this)">
                    <div class="card-body">
                        <h5 class="card-title" ondblclick="makeTitleEditable(this)" id="title${areaIndex}">Area ${areaIndex}</h5>
                        <div class="panel-info">
                            <p>Panels: <span id="panelCount${areaIndex}">0</span></p>
                            <div class="form-check form-switch" style="display: flex; justify-content: space-between;">
                            <input class="form-check-input" type="checkbox" id="orientationSwitch${areaIndex}" onchange="toggleOrientation(this)" style="order: 2;">
                            <label class="form-check-label" for="orientationSwitch${areaIndex}" style="order: 1; margin-right: 50px;">Horizontal</label>
                            </div>
                        </div>
                        <p>Azimuth: <span id="azimuth${areaIndex}">0</span></p>
                        <div class="input-group mt-3">
                            <label class="input-group-text" for="roofSlopeInput">Slope (°)</label>
                            <input class="form-control" type="number" min="0" max="90" id="slope${areaIndex}" placeholder="Enter slope (Default 0)" onchange="updateAreaSlope(this)">
                        </div>
                         <div class="input-group mt-3" style="padding-bottom: 10px">
                            <label class="input-group-text" for="roofSlopeInput">Mounting position</label>
                            <select class="form-select" id="mountingPosition${areaIndex}" onchange="updateMountingPosition(this)">
                                <option value="0">Roof added</option>
                                <option value="1">Free standing</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="shapesHandler.fillAreaWithPanels()">Fill with panels</button>
                        <button class="btn btn-primary" onclick="shapesHandler.rotateSelectedShape()">Rotate</button>
                        <button class="btn btn-danger" onclick="shapesHandler.deleteShape()">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;

    // Append the new subpanel to the container
    subpanelsContainer.appendChild(newSubpanel);
}

function toggleOrientation(switchElement) {
    const label = switchElement.nextElementSibling;
    label.textContent = switchElement.checked ? "Vertical" : "Horizontal";
}

function deleteControlPanel(index) {
    shapesHandler.clearSelection();
    const subpanelsContainer = document.getElementById("areaControlPanels");
    const subpanels = subpanelsContainer.querySelectorAll(".col-md.subpanel");

    if (index >= 0 && index < subpanels.length) {
        subpanels[index].remove();

        // Update the indices of the remaining subpanels
        for (let i = index+1; i < subpanels.length; i++) {
            console.log('i: ' + i);
            const titleElement = document.getElementById("title" + (i));
            titleElement.id = "title" + (i-1);
            const panelCountElement = document.getElementById("panelCount" + (i));
            panelCountElement.id = "panelCount" + (i-1);
            const azimuthElement = document.getElementById("azimuth" + (i));
            azimuthElement.id = "azimuth" + (i-1);
            const slopeElement = document.getElementById("slope" + (i));
            slopeElement.id = "slope" + (i-1);
            const mountingPositionElement = document.getElementById("mountingPosition" + (i));
            mountingPositionElement.id = "mountingPosition" + (i-1);

        }

    }
}
function highlightControlPanel(panel) {
    const allPanels = document.querySelectorAll(".card");
    allPanels.forEach((p) => {
        p.classList.remove("highlight");
    });
    panel.classList.add("highlight");
    const allButtons = document.querySelectorAll(".card-body button");
    allButtons.forEach((b) => {
        b.disabled = true; // Disable all buttons by default
    });
    const buttonsInSelectedPanel = panel.querySelectorAll("button");
    buttonsInSelectedPanel.forEach((b) => {
        b.disabled = false; // Enable buttons in the selected panel
    });
    const index = Array.from(allPanels).indexOf(panel);
    if (index >= 0) {
        shapesHandler.selectShape(shapesHandler.shapes[index]);
    }
}

function selectControlPanel(index) {
    const subpanels = document.querySelectorAll(".card");
    const subpanel = subpanels[index];
    subpanel.click();
}

function clearHighlight() {
    console.log('clearHighlight');
    const allPanels = document.querySelectorAll(".card");
    allPanels.forEach((p) => {
        p.classList.remove("highlight");
    });
    const allButtons = document.querySelectorAll(".card-body button");
    allButtons.forEach((b) => {
        b.disabled = true;
    });
}


function makeTitleEditable(titleElement) {
    titleElement.contentEditable = true;
    titleElement.classList.add("editable-title");

    titleElement.focus();

    titleElement.addEventListener("blur", function () {
        titleElement.contentEditable = false;
        titleElement.classList.remove("editable-title");
    });
}

function refreshPanelsCount() {
    // refresh panels count on the control panel
    for (let i = 0; i < shapesHandler.shapesCount; i++) {
        const p = document.getElementById("panelCount" + (i));
        p.textContent = markerHandler.markers[i].length;
    }
}

function updateAreaSlope(slopeInput) {
    const slope = slopeInput.value;
    const shape = shapesHandler.selectedShape;
    shape.setSlope(slope);
    if (shape.panelsCount > 0) {
       shapesHandler.fillAreaWithPanels();
    }
}

function updateMountingPosition(positionInput) {
    const position = positionInput.value;
    const shape = shapesHandler.selectedShape;
    if (position === '0') {
        shape.setMountingPosition('roof');
    }
    else if (position === '1') {
        shape.setMountingPosition('free-standing');
    }
    console.log(shape.mountingType);
}

function updateControlPanelTitle(titleInput, index) {
    const titleElement = document.getElementById("title" + (index));
    titleElement.textContent = titleInput;
}

function updateControlPanelSlope(slopeInput, index) {
    const slopeElement = document.getElementById("slope" + (index));
    slopeElement.value = slopeInput;
}

function updateControlPanelMountingPosition(positionInput, index) {
    const positionElement = document.getElementById("mountingPosition" + (index));
    console.log(positionInput);
    if (positionInput === 'option2') {
        positionElement.value = 0;
    }else if (positionInput === 'option1') {
        positionElement.value = 1;
    }
}