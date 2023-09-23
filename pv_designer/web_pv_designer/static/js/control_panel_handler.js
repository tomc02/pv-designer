function addControlPanel() {
    const subpanelsContainer = document.getElementById("areaControlPanels");
    const newSubpanel = document.createElement("div");
    const areaIndex = subpanelsContainer.querySelectorAll(".col-md.subpanel").length + 1;
    newSubpanel.className = "col-md subpanel";
    newSubpanel.style.maxWidth = "50%";
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
                        <div class="input-group mt-3" style="padding-bottom: 10px">
                            <label class="input-group-text" for="roofSlopeInput">Slope (°)</label>
                            <input class="form-control" type="number" min="0" max="90" id="slope${areaIndex}" placeholder="Enter slope (Default 0)">
                        </div>
                        <button class="btn btn-primary" onclick="fillAreaWithPanels()">Fill with panels</button>
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

function toggleOrientation(switchElement) {
    const label = switchElement.nextElementSibling;
    label.textContent = switchElement.checked ? "Vertical" : "Horizontal";
}

function deleteControlPanel(index) {
    clearSelection();
    const subpanelsContainer = document.getElementById("areaControlPanels");
    const subpanels = subpanelsContainer.querySelectorAll(".col-md.subpanel");

    if (index >= 0 && index < subpanels.length) {
        subpanels[index].remove();
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
        selectShape(shapes[index]);
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
    for (let i = 0; i < shapes.length; i++) {
        const p = document.getElementById("panelCount" + (i + 1));
        p.textContent = markers[i].length;
    }
}