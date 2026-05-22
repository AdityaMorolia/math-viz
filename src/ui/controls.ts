import {
  addVector,
  deleteVector,
  getPairVectors,
  getSelectedVector,
  resetView,
  setGlobalTransform,
  setPairVector,
  setSelectedTransform,
  setSelectedVector,
  setZoomOut,
  updateVectorValue,
} from "../app/state";
import type { AppState, Mat2, Vec2, VectorItem } from "../app/types";
import { applyMat2, det2, mat2FromColumns } from "../math/mat2";
import { add, norm, sub } from "../math/vec2";
import { formatNumber, mustGetElement, readNumberInput, setNumberInput } from "./dom";

export type ControlBindings = {
  syncFromState: () => void;
};

type MatrixBinding = {
  ids: [string, string, string, string];
  write: (matrix: Mat2) => void;
};

let requestRedraw: () => void = () => {};

export function bindControls(state: AppState, redraw: () => void): ControlBindings {
  requestRedraw = redraw;
  bindVectorButtons(state, redraw);
  bindMatrixInputs(state, redraw);
  bindPairSelectors(state, redraw);
  bindZoomSlider(state, redraw);

  const bindings = {
    syncFromState: () => syncControlsFromState(state),
  };
  bindings.syncFromState();
  return bindings;
}

function bindVectorButtons(state: AppState, redraw: () => void): void {
  mustGetElement<HTMLButtonElement>("add-vector").addEventListener("click", () => {
    addVector(state);
    syncControlsFromState(state);
    redraw();
  });
}

function bindMatrixInputs(state: AppState, redraw: () => void): void {
  const bindings: MatrixBinding[] = [
    {
      ids: ["selected-a11", "selected-a12", "selected-a21", "selected-a22"],
      write: (matrix) => setSelectedTransform(state, matrix),
    },
    {
      ids: ["global-a11", "global-a12", "global-a21", "global-a22"],
      write: (matrix) => setGlobalTransform(state, matrix),
    },
  ];

  for (const binding of bindings) {
    for (const id of binding.ids) {
      mustGetElement<HTMLInputElement>(id).addEventListener("input", () => {
        binding.write(readMatrix(binding.ids));
        syncReadouts(state);
        redraw();
      });
    }
  }
}

function bindPairSelectors(state: AppState, redraw: () => void): void {
  mustGetElement<HTMLSelectElement>("pair-first").addEventListener("change", (event) => {
    setPairVector(state, "firstId", (event.currentTarget as HTMLSelectElement).value);
    syncReadouts(state);
    redraw();
  });

  mustGetElement<HTMLSelectElement>("pair-second").addEventListener("change", (event) => {
    setPairVector(state, "secondId", (event.currentTarget as HTMLSelectElement).value);
    syncReadouts(state);
    redraw();
  });
}

function bindZoomSlider(state: AppState, redraw: () => void): void {
  mustGetElement<HTMLInputElement>("zoomOut").addEventListener("input", (event) => {
    setZoomOut(state, Number((event.currentTarget as HTMLInputElement).value));
    redraw();
  });

  mustGetElement<HTMLButtonElement>("reset-view").addEventListener("click", () => {
    resetView(state);
    syncControlsFromState(state);
    redraw();
  });
}

function syncControlsFromState(state: AppState): void {
  renderVectorList(state);
  syncMatrixInputs("selected", state.selectedTransform);
  syncMatrixInputs("global", state.globalTransform);
  syncPairSelectors(state);
  mustGetElement<HTMLInputElement>("zoomOut").value = state.zoomOut.toString();
  syncReadouts(state);
}

function renderVectorList(state: AppState): void {
  const list = mustGetElement<HTMLElement>("vector-list");
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
    syncControlsFromState(state);
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
    syncReadouts(state);
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
    syncControlsFromState(state);
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

function syncMatrixInputs(prefix: "selected" | "global", matrix: Mat2): void {
  setNumberInput(`${prefix}-a11`, matrix[0][0]);
  setNumberInput(`${prefix}-a12`, matrix[0][1]);
  setNumberInput(`${prefix}-a21`, matrix[1][0]);
  setNumberInput(`${prefix}-a22`, matrix[1][1]);
}

function syncPairSelectors(state: AppState): void {
  syncPairSelector("pair-first", state, state.pairSelection.firstId);
  syncPairSelector("pair-second", state, state.pairSelection.secondId);
}

function syncPairSelector(id: string, state: AppState, selectedId: string): void {
  const select = mustGetElement<HTMLSelectElement>(id);
  select.replaceChildren();

  if (state.vectors.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "None";
    select.append(option);
    select.disabled = true;
    return;
  }

  select.disabled = false;
  for (const vector of state.vectors) {
    const option = document.createElement("option");
    option.value = vector.id;
    option.textContent = vector.label;
    option.selected = vector.id === selectedId;
    select.append(option);
  }
}

function syncReadouts(state: AppState): void {
  const selected = getSelectedVector(state);
  if (selected) {
    const image = applyMat2(state.selectedTransform, selected.value);
    setText("readout-selected-name", selected.label);
    setText("readout-selected-coords", formatVector(selected.value));
    setText("readout-selected-length", formatNumber(norm(selected.value)));
    setText("readout-selected-image", formatVector(image));
  } else {
    setText("readout-selected-name", "n/a");
    setText("readout-selected-coords", "n/a");
    setText("readout-selected-length", "n/a");
    setText("readout-selected-image", "n/a");
  }

  const [first, second] = getPairVectors(state);
  if (first && second) {
    const sum = add(first.value, second.value);
    const difference = sub(first.value, second.value);
    const determinant = det2(mat2FromColumns(first.value, second.value));
    setText("readout-pair-sum", formatVector(sum));
    setText("readout-pair-difference", formatVector(difference));
    setText("readout-pair-det", formatNumber(determinant));
    setText("readout-pair-area", formatNumber(Math.abs(determinant)));
  } else {
    setText("readout-pair-sum", "n/a");
    setText("readout-pair-difference", "n/a");
    setText("readout-pair-det", "n/a");
    setText("readout-pair-area", "n/a");
  }
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

function formatVector(vector: Vec2): string {
  return `(${formatNumber(vector.x)}, ${formatNumber(vector.y)})`;
}

function setText(id: string, text: string): void {
  mustGetElement<HTMLElement>(id).textContent = text;
}

function dispatchRedraw(): void {
  requestRedraw();
}
