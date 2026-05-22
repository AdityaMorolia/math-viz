import {
  addVector,
  deleteVector,
  getPairVectors,
  getSelectedVector,
  resetView,
  setMode,
  setPairVector,
  setScalarMultiplier,
  setSelectedVector,
  setShowComponentLegs,
  setTransformMatrix,
  setTransformT,
  setZoomOut,
  updateVectorValue,
} from "../app/state";
import type { AppState, DojoMode, Mat2, Vec2, VectorItem } from "../app/types";
import { realEigenpairs2 } from "../math/eigen";
import { det2, mat2FromColumns } from "../math/mat2";
import { add, norm, scale, sub } from "../math/vec2";
import { formatNumber, mustGetElement, readNumberInput } from "./dom";

export type ControlBindings = {
  syncFromState: () => void;
};

type MatrixPreset = {
  label: string;
  matrix: Mat2;
};

const MATRIX_INPUT_IDS: [string, string, string, string] = [
  "transform-a11",
  "transform-a12",
  "transform-a21",
  "transform-a22",
];

const MATRIX_PRESETS: MatrixPreset[] = [
  {
    label: "Identity",
    matrix: [
      [1, 0],
      [0, 1],
    ],
  },
  {
    label: "Scale",
    matrix: [
      [1.5, 0],
      [0, 0.75],
    ],
  },
  {
    label: "X-shear",
    matrix: [
      [1, 0.8],
      [0, 1],
    ],
  },
  {
    label: "Y-shear",
    matrix: [
      [1, 0],
      [0.8, 1],
    ],
  },
  {
    label: "Rotate 45",
    matrix: [
      [Math.SQRT1_2, -Math.SQRT1_2],
      [Math.SQRT1_2, Math.SQRT1_2],
    ],
  },
  {
    label: "Reflect x",
    matrix: [
      [1, 0],
      [0, -1],
    ],
  },
];

let requestRedraw: () => void = () => {};

export function bindControls(state: AppState, redraw: () => void): ControlBindings {
  requestRedraw = redraw;
  bindModeSelect(state, redraw);
  bindZoomControls(state, redraw);

  const bindings = {
    syncFromState: () => syncControlsFromState(state),
  };
  bindings.syncFromState();
  return bindings;
}

function bindModeSelect(state: AppState, redraw: () => void): void {
  mustGetElement<HTMLSelectElement>("mode-select").addEventListener("change", (event) => {
    setMode(state, readMode((event.currentTarget as HTMLSelectElement).value));
    syncControlsFromState(state);
    redraw();
  });
}

function bindZoomControls(state: AppState, redraw: () => void): void {
  mustGetElement<HTMLInputElement>("zoomOut").addEventListener("input", (event) => {
    setZoomOut(state, Number((event.currentTarget as HTMLInputElement).value));
    redraw();
  });

  mustGetElement<HTMLButtonElement>("reset-view").addEventListener("click", () => {
    resetView(state);
    syncStaticControlsFromState(state);
    redraw();
  });
}

function syncControlsFromState(state: AppState): void {
  syncStaticControlsFromState(state);
  renderModePanel(state);
}

function syncStaticControlsFromState(state: AppState): void {
  mustGetElement<HTMLSelectElement>("mode-select").value = state.mode;
  mustGetElement<HTMLInputElement>("zoomOut").value = state.zoomOut.toString();
}

function renderModePanel(state: AppState): void {
  const panel = mustGetElement<HTMLElement>("mode-panel");
  if (state.mode === "algebra") {
    panel.replaceChildren(...renderAlgebraPanel(state));
    syncAlgebraReadouts(state);
    return;
  }

  if (state.mode === "geometry") {
    panel.replaceChildren(...renderGeometryPanel(state));
    return;
  }

  panel.replaceChildren(...renderEigenPanel(state));
  syncEigenReadouts(state);
}

function renderAlgebraPanel(state: AppState): HTMLElement[] {
  return [
    renderVectorSection(state),
    renderSelectedVectorSection(),
    renderAlgebraToolsSection(state),
    renderPairSection(state),
  ];
}

function renderGeometryPanel(state: AppState): HTMLElement[] {
  const matrixSection = createPanelSection("Matrix");
  matrixSection.append(createMatrixEditor(state, () => dispatchRedraw()));
  matrixSection.append(createMatrixNote("Orange grid and ghosts show the interpolated transform."));

  const presetSection = createPanelSection("Presets");
  presetSection.append(createPresetGrid(state));

  const interpolationSection = createPanelSection("Interpolation");
  interpolationSection.append(createTransformTControl(state));

  return [matrixSection, presetSection, interpolationSection];
}

function renderEigenPanel(state: AppState): HTMLElement[] {
  const matrixSection = createPanelSection("Matrix");
  matrixSection.append(createMatrixEditor(state, () => {
    syncEigenReadouts(state);
    dispatchRedraw();
  }));

  const presetSection = createPanelSection("Presets");
  presetSection.append(createPresetGrid(state));

  const readoutSection = createPanelSection("Eigen Readout", "info-section");
  readoutSection.append(
    createReadoutList([
      ["state", "readout-eigen-state"],
      ["values", "readout-eigen-values"],
      ["vectors", "readout-eigen-vectors"],
      ["disc", "readout-eigen-discriminant"],
    ]),
  );

  return [matrixSection, presetSection, readoutSection];
}

function renderVectorSection(state: AppState): HTMLElement {
  const section = document.createElement("section");
  section.className = "panel-section";

  const heading = document.createElement("div");
  heading.className = "section-heading";

  const title = document.createElement("div");
  title.className = "section-title";
  title.textContent = "Vectors";

  const addButton = document.createElement("button");
  addButton.id = "add-vector";
  addButton.className = "small-button";
  addButton.type = "button";
  addButton.textContent = "Add vector";
  addButton.addEventListener("click", () => {
    addVector(state);
    renderModePanel(state);
    dispatchRedraw();
  });

  heading.append(title, addButton);
  section.append(heading);

  const list = document.createElement("div");
  list.id = "vector-list";
  list.className = "vector-list";
  list.setAttribute("aria-label", "Editable vectors");
  renderVectorList(state, list);
  section.append(list);

  return section;
}

function renderSelectedVectorSection(): HTMLElement {
  const section = createPanelSection("Selected Vector", "info-section");
  section.append(
    createReadoutList([
      ["name", "readout-selected-name"],
      ["coords", "readout-selected-coords"],
      ["length", "readout-selected-length"],
      ["k * vector", "readout-selected-scaled"],
    ]),
  );
  return section;
}

function renderAlgebraToolsSection(state: AppState): HTMLElement {
  const section = createPanelSection("Algebra Tools");

  const scalarLabel = document.createElement("label");
  scalarLabel.className = "range-label";
  scalarLabel.append(document.createTextNode("Scalar multiplier "));

  const scalarValue = document.createElement("span");
  scalarValue.id = "scalar-multiplier-value";
  scalarValue.className = "range-value";
  scalarValue.textContent = formatNumber(state.scalarMultiplier);

  const scalarInput = document.createElement("input");
  scalarInput.id = "scalar-multiplier";
  scalarInput.type = "range";
  scalarInput.min = "-3";
  scalarInput.max = "3";
  scalarInput.step = "0.05";
  scalarInput.value = state.scalarMultiplier.toString();
  scalarInput.addEventListener("input", (event) => {
    setScalarMultiplier(state, Number((event.currentTarget as HTMLInputElement).value));
    scalarValue.textContent = formatNumber(state.scalarMultiplier);
    syncAlgebraReadouts(state);
    dispatchRedraw();
  });

  scalarLabel.append(scalarValue, scalarInput);

  const componentLabel = document.createElement("label");
  componentLabel.className = "toggle-label";

  const componentInput = document.createElement("input");
  componentInput.id = "show-component-legs";
  componentInput.type = "checkbox";
  componentInput.checked = state.showComponentLegs;
  componentInput.addEventListener("change", (event) => {
    setShowComponentLegs(state, (event.currentTarget as HTMLInputElement).checked);
    dispatchRedraw();
  });

  componentLabel.append(componentInput, document.createTextNode("Show x/y component legs"));
  section.append(scalarLabel, componentLabel);
  return section;
}

function renderPairSection(state: AppState): HTMLElement {
  const section = createPanelSection("Vector Pair", "info-section");

  const picker = document.createElement("div");
  picker.className = "pair-picker";
  picker.append(
    createPairSelect("First", "pair-first", state, state.pairSelection.firstId, (id) => {
      setPairVector(state, "firstId", id);
      syncAlgebraReadouts(state);
      dispatchRedraw();
    }),
    createPairSelect("Second", "pair-second", state, state.pairSelection.secondId, (id) => {
      setPairVector(state, "secondId", id);
      syncAlgebraReadouts(state);
      dispatchRedraw();
    }),
  );

  section.append(
    picker,
    createReadoutList([
      ["sum", "readout-pair-sum"],
      ["difference", "readout-pair-difference"],
      ["det", "readout-pair-det"],
      ["area", "readout-pair-area"],
    ]),
  );

  return section;
}

function renderVectorList(state: AppState, list: HTMLElement): void {
  list.replaceChildren();

  if (state.vectors.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "No vectors yet.";
    list.append(empty);
    return;
  }

  for (const vector of state.vectors) {
    list.append(createVectorRow(state, vector));
  }
}

function createVectorRow(state: AppState, vector: VectorItem): HTMLElement {
  const row = document.createElement("div");
  row.className = vector.id === state.selectedVectorId ? "vector-row selected" : "vector-row";

  const selectButton = document.createElement("button");
  selectButton.type = "button";
  selectButton.className = "vector-select";
  selectButton.setAttribute("aria-label", `Select ${vector.label}`);
  selectButton.addEventListener("click", () => {
    setSelectedVector(state, vector.id);
    renderModePanel(state);
    dispatchRedraw();
  });

  const swatch = document.createElement("span");
  swatch.className = "vector-swatch";
  swatch.style.background = vector.color;

  const name = document.createElement("span");
  name.textContent = vector.label;

  selectButton.append(swatch, name);

  const xInput = createVectorInput(`${vector.label} x`, vector.value.x);
  const yInput = createVectorInput(`${vector.label} y`, vector.value.y);

  const updateValue = () => {
    updateVectorValue(state, vector.id, {
      x: readInputNumber(xInput),
      y: readInputNumber(yInput),
    });
    setSelectedVector(state, vector.id);
    row.classList.add("selected");
    syncAlgebraReadouts(state);
    dispatchRedraw();
  };

  xInput.addEventListener("input", updateValue);
  yInput.addEventListener("input", updateValue);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "vector-delete";
  deleteButton.textContent = "Remove";
  deleteButton.addEventListener("click", () => {
    deleteVector(state, vector.id);
    renderModePanel(state);
    dispatchRedraw();
  });

  row.append(selectButton, xInput, yInput, deleteButton);
  return row;
}

function createVectorInput(label: string, value: number): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "number";
  input.step = "0.05";
  input.value = formatNumber(value);
  input.setAttribute("aria-label", label);
  return input;
}

function createMatrixEditor(state: AppState, onInput: () => void): HTMLElement {
  const editor = document.createElement("div");
  editor.className = "matrix-editor";
  editor.setAttribute("aria-label", "Transformation matrix");

  const name = document.createElement("span");
  name.className = "matrix-name";
  name.textContent = "A =";

  const box = document.createElement("div");
  box.className = "matrix-box";

  const values = [
    state.transformMatrix[0][0],
    state.transformMatrix[0][1],
    state.transformMatrix[1][0],
    state.transformMatrix[1][1],
  ];

  MATRIX_INPUT_IDS.forEach((id, index) => {
    const input = document.createElement("input");
    input.id = id;
    input.type = "number";
    input.step = "0.05";
    input.value = formatNumber(values[index]);
    input.setAttribute("aria-label", `matrix entry ${index + 1}`);
    input.addEventListener("input", () => {
      setTransformMatrix(state, readMatrix(MATRIX_INPUT_IDS));
      onInput();
    });
    box.append(input);
  });

  editor.append(name, box);
  return editor;
}

function createMatrixNote(text: string): HTMLElement {
  const note = document.createElement("p");
  note.className = "matrix-note";
  note.textContent = text;
  return note;
}

function createPresetGrid(state: AppState): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "preset-grid";

  for (const preset of MATRIX_PRESETS) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = preset.label;
    button.addEventListener("click", () => {
      setTransformMatrix(state, preset.matrix);
      renderModePanel(state);
      dispatchRedraw();
    });
    grid.append(button);
  }

  return grid;
}

function createTransformTControl(state: AppState): HTMLElement {
  const label = document.createElement("label");
  label.className = "range-label";
  label.append(document.createTextNode("Transform t "));

  const value = document.createElement("span");
  value.id = "transform-t-value";
  value.className = "range-value";
  value.textContent = formatNumber(state.transformT);

  const input = document.createElement("input");
  input.id = "transform-t";
  input.type = "range";
  input.min = "0";
  input.max = "1";
  input.step = "0.01";
  input.value = state.transformT.toString();
  input.addEventListener("input", (event) => {
    setTransformT(state, Number((event.currentTarget as HTMLInputElement).value));
    value.textContent = formatNumber(state.transformT);
    dispatchRedraw();
  });

  label.append(value, input);
  return label;
}

function createPairSelect(
  labelText: string,
  id: string,
  state: AppState,
  selectedId: string,
  onChange: (id: string) => void,
): HTMLElement {
  const label = document.createElement("label");
  label.textContent = labelText;

  const select = document.createElement("select");
  select.id = id;
  select.setAttribute("aria-label", labelText.toLowerCase());

  if (state.vectors.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "None";
    select.append(option);
    select.disabled = true;
  } else {
    for (const vector of state.vectors) {
      const option = document.createElement("option");
      option.value = vector.id;
      option.textContent = vector.label;
      option.selected = vector.id === selectedId;
      select.append(option);
    }
  }

  select.addEventListener("change", (event) => {
    onChange((event.currentTarget as HTMLSelectElement).value);
  });

  label.append(select);
  return label;
}

function createPanelSection(titleText: string, extraClass = ""): HTMLElement {
  const section = document.createElement("section");
  section.className = extraClass ? `panel-section ${extraClass}` : "panel-section";

  const title = document.createElement("div");
  title.className = "section-title";
  title.textContent = titleText;
  section.append(title);

  return section;
}

function createReadoutList(rows: [string, string][]): HTMLElement {
  const list = document.createElement("dl");

  for (const [term, id] of rows) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    dt.textContent = term;

    const dd = document.createElement("dd");
    dd.id = id;
    dd.textContent = "n/a";

    row.append(dt, dd);
    list.append(row);
  }

  return list;
}

function syncAlgebraReadouts(state: AppState): void {
  const selected = getSelectedVector(state);
  if (selected) {
    setTextIfPresent("readout-selected-name", selected.label);
    setTextIfPresent("readout-selected-coords", formatVector(selected.value));
    setTextIfPresent("readout-selected-length", formatNumber(norm(selected.value)));
    setTextIfPresent(
      "readout-selected-scaled",
      formatVector(scale(selected.value, state.scalarMultiplier)),
    );
  } else {
    setTextIfPresent("readout-selected-name", "n/a");
    setTextIfPresent("readout-selected-coords", "n/a");
    setTextIfPresent("readout-selected-length", "n/a");
    setTextIfPresent("readout-selected-scaled", "n/a");
  }

  const [first, second] = getPairVectors(state);
  if (first && second) {
    const sum = add(first.value, second.value);
    const difference = sub(first.value, second.value);
    const determinant = det2(mat2FromColumns(first.value, second.value));
    setTextIfPresent("readout-pair-sum", formatVector(sum));
    setTextIfPresent("readout-pair-difference", formatVector(difference));
    setTextIfPresent("readout-pair-det", formatNumber(determinant));
    setTextIfPresent("readout-pair-area", formatNumber(Math.abs(determinant)));
  } else {
    setTextIfPresent("readout-pair-sum", "n/a");
    setTextIfPresent("readout-pair-difference", "n/a");
    setTextIfPresent("readout-pair-det", "n/a");
    setTextIfPresent("readout-pair-area", "n/a");
  }
}

function syncEigenReadouts(state: AppState): void {
  const result = realEigenpairs2(state.transformMatrix);
  setTextIfPresent("readout-eigen-discriminant", formatNumber(result.discriminant));

  if (result.kind === "none-real") {
    setTextIfPresent("readout-eigen-state", "no real eigenvectors");
    setTextIfPresent("readout-eigen-values", "complex pair");
    setTextIfPresent("readout-eigen-vectors", "n/a");
    return;
  }

  if (result.kind === "every-direction") {
    setTextIfPresent("readout-eigen-state", "every direction");
    setTextIfPresent("readout-eigen-values", formatValues(result.eigenvalues));
    setTextIfPresent("readout-eigen-vectors", "all nonzero vectors");
    return;
  }

  setTextIfPresent(
    "readout-eigen-state",
    result.kind === "two-real" ? "two real directions" : "single eigenline",
  );
  setTextIfPresent("readout-eigen-values", formatValues(result.eigenvalues));
  setTextIfPresent(
    "readout-eigen-vectors",
    result.eigenpairs
      .map((pair) => `${formatNumber(pair.value)}: ${formatVector(pair.vector)}`)
      .join("; "),
  );
}

function readMatrix(ids: [string, string, string, string]): Mat2 {
  return [
    [readNumberInput(ids[0]), readNumberInput(ids[1])],
    [readNumberInput(ids[2]), readNumberInput(ids[3])],
  ];
}

function readInputNumber(input: HTMLInputElement): number {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : 0;
}

function readMode(value: string): DojoMode {
  if (value === "geometry" || value === "eigenvectors") {
    return value;
  }
  return "algebra";
}

function formatValues(values: number[]): string {
  return values.length > 0 ? values.map(formatNumber).join(", ") : "n/a";
}

function formatVector(vector: Vec2): string {
  return `(${formatNumber(vector.x)}, ${formatNumber(vector.y)})`;
}

function setTextIfPresent(id: string, text: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}

function dispatchRedraw(): void {
  requestRedraw();
}
