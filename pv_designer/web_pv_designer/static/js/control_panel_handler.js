function addControlPanel() {
    const panelsContainer = $("#areaControlPanels");
    const areaIndex = panelsContainer.find(".col-md.subpanel").length;
    const newSubpanelHTML = `
        <div class="subpanel col-sm-12 col-md">
            <div class="card" onclick="highlightControlPanel(this)">
                <div class="card-body">
                    <h5 class="card-title" ondblclick="makeTitleEditable(this)" id="title${areaIndex}">Area ${areaIndex}</h5>
                    <div class="panel-info">
                        <p>Panels: <span id="panelCount${areaIndex}">0</span></p>
                        <div class="form-check form-switch" style="display: flex; justify-content: space-between;">
                            <input class="form-check-input" type="checkbox" id="orientationSwitch${areaIndex}" onchange="toggleOrientation(this)" style="order: 2;">
                            <label class="form-check-label" for="orientationSwitch${areaIndex}" style="order: 1; margin-right: 50px;">Vertical</label>
                        </div>
                    </div>
                    <p>Azimuth: <span id="azimuth${areaIndex}">0</span></p>
                    <div class="input-group mt-3">
                        <label class="input-group-text" for="roofSlopeInput">Slope (°)</label>
                        <input class="form-control" type="number" min="0" max="90" id="slope${areaIndex}" placeholder="Slope" onchange="updateAreaSlope(this)">
                    </div>
                    <div class="input-group mt-3" style="padding-bottom: 10px">
                        <label class="input-group-text" for="roofSlopeInput">Mounting position</label>
                        <select class="form-select" id="mountingPosition${areaIndex}" onchange="updateMountingPosition(this)">
                            <option value="building">Building integrated</option>
                            <option value="free">Free standing</option>
                            <option value="optimize">Optimize position</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="shapesHandler.fillAreaWithPanels()">Fill with panels</button>
                    <button class="btn btn-primary" onclick="shapesHandler.rotateSelectedShape()">Rotate</button>
                    <button class="btn btn-danger" onclick="shapesHandler.deleteShape()">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Append the new subpanel to the container
    panelsContainer.append(newSubpanelHTML);
    const $confirmationButton = $("#confirmationButton");
    if ($confirmationButton.css("display") === "none") {
        $confirmationButton.css("display", "block");
    }
}

function toggleOrientation(switchElement) {
    const $label = $(switchElement).next();
    $label.text(switchElement.checked ? "Horizontal" : "Vertical");
    shapesHandler.changePanelsOrientation();
}


function deleteControlPanel(index) {
    shapesHandler.clearSelection();
    const panels = $("#areaControlPanels .col-md.subpanel");

    if (index >= 0 && index < panels.length) {
        panels.eq(index).remove();
        for (let i = index + 1; i < panels.length; i++) {
            console.log('i: ' + i);
            $("#title" + i).attr('id', "title" + (i - 1));
            $("#panelCount" + i).attr('id', "panelCount" + (i - 1));
            $("#azimuth" + i).attr('id', "azimuth" + (i - 1));
            $("#slope" + i).attr('id', "slope" + (i - 1));
            $("#mountingPosition" + i).attr('id', "mountingPosition" + (i - 1));
        }
    }
    console.log('len' + panels.length);
    if (panels.length === 1) {
        $("#confirmationButton").hide();
    }
}

function highlightControlPanel(panel) {
    $(".card").removeClass("highlight");
    $(panel).addClass("highlight");

    $(".card-body button").prop('disabled', true);
    $(panel).find("button").prop('disabled', false);

    const index = $(".card").index(panel);
    if (index >= 0) {
        shapesHandler.selectShape(shapesHandler.shapes[index]);
    }
}


function selectControlPanel(index) {
    $(".card")[index].click();
}

function clearHighlight() {
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
        $("#panelCount" + i).text(markerHandler.markers[i].length);
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

function refreshAllSlopes() {
    for (let i = 0; i < shapesHandler.shapesCount; i++) {
        const slopeValue = $("#slope" + i).val();
        shapesHandler.shapesObjects[i].setSlope(slopeValue);
    }
}

function updateMountingPosition(positionInput) {
    const position = $(positionInput).val();
    const shape = shapesHandler.selectedShape;
    if (position === '0') {
        shape.setMountingPosition('roof');
    } else if (position === '1') {
        shape.setMountingPosition('free-standing');
    }
    console.log(shape.mountingType);
}

function updateControlPanelTitle(titleInput, index) {
    $("#title" + index).text(titleInput);
}

function updateControlPanelSlope(slopeInput, index) {
    $("#slope" + index).val(slopeInput);
}

function updateControlPanelMountingPosition(positionInput, index) {
    $('#mountingPosition' + index).val(positionInput);
}