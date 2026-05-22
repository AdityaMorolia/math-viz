import type { AppState, Mat2, Vec2, VectorItem } from "./types";

const VECTOR_COLORS = [
  "#d13f31",
  "#1f7a4d",
  "#1f6feb",
  "#d79012",
  "#7f57c2",
  "#008da6",
  "#d62f7f",
];

const IDENTITY: Mat2 = [
  [1, 0],
  [0, 1],
];

export function createInitialState(): AppState {
  return {
    vectors: [
      { id: "v1", label: "u", value: { x: 1, y: 0.5 }, color: VECTOR_COLORS[0] },
      { id: "v2", label: "v", value: { x: 0.45, y: 1.25 }, color: VECTOR_COLORS[1] },
      { id: "v3", label: "w", value: { x: -0.9, y: 0.75 }, color: VECTOR_COLORS[2] },
    ],
    selectedVectorId: "v1",
    selectedTransform: copyMatrix(IDENTITY),
    globalTransform: copyMatrix(IDENTITY),
    pairSelection: {
      firstId: "v1",
      secondId: "v2",
    },
    zoomOut: 1.2,
    pan: { x: 0, y: 0 },
    nextVectorNumber: 4,
  };
}

export function getVector(state: AppState, id: string | null): VectorItem | null {
  if (!id) {
    return null;
  }
  return state.vectors.find((vector) => vector.id === id) ?? null;
}

export function getSelectedVector(state: AppState): VectorItem | null {
  return getVector(state, state.selectedVectorId);
}

export function getPairVectors(state: AppState): [VectorItem | null, VectorItem | null] {
  return [
    getVector(state, state.pairSelection.firstId),
    getVector(state, state.pairSelection.secondId),
  ];
}

export function addVector(state: AppState): VectorItem {
  const vectorNumber = state.nextVectorNumber;
  const angle = ((vectorNumber - 1) * Math.PI * 2) / 7;
  const vector: VectorItem = {
    id: `v${vectorNumber}`,
    label: `v${vectorNumber}`,
    value: {
      x: Math.cos(angle) * 1.2,
      y: Math.sin(angle) * 1.2,
    },
    color: VECTOR_COLORS[(vectorNumber - 1) % VECTOR_COLORS.length],
  };

  state.nextVectorNumber += 1;
  state.vectors.push(vector);
  state.selectedVectorId = vector.id;
  normalizeStateRefs(state);
  return vector;
}

export function deleteVector(state: AppState, id: string): void {
  state.vectors = state.vectors.filter((vector) => vector.id !== id);
  normalizeStateRefs(state);
}

export function setSelectedVector(state: AppState, id: string | null): void {
  state.selectedVectorId = getVector(state, id) ? id : (state.vectors[0]?.id ?? null);
}

export function updateVectorValue(state: AppState, id: string, value: Vec2): void {
  const vector = getVector(state, id);
  if (vector) {
    vector.value = value;
  }
}

export function setSelectedTransform(state: AppState, transform: Mat2): void {
  state.selectedTransform = transform;
}

export function setGlobalTransform(state: AppState, transform: Mat2): void {
  state.globalTransform = transform;
}

export function setPairVector(
  state: AppState,
  which: keyof AppState["pairSelection"],
  id: string,
): void {
  if (getVector(state, id)) {
    state.pairSelection[which] = id;
  }
}

export function setZoomOut(state: AppState, value: number): void {
  state.zoomOut = value;
}

export function resetView(state: AppState): void {
  state.zoomOut = 1.2;
  state.pan = { x: 0, y: 0 };
}

function normalizeStateRefs(state: AppState): void {
  const firstId = state.vectors[0]?.id ?? "";
  const secondId = state.vectors[1]?.id ?? firstId;

  if (!getVector(state, state.selectedVectorId)) {
    state.selectedVectorId = firstId || null;
  }

  if (!getVector(state, state.pairSelection.firstId)) {
    state.pairSelection.firstId = firstId;
  }

  if (!getVector(state, state.pairSelection.secondId)) {
    state.pairSelection.secondId = secondId;
  }
}

function copyMatrix(matrix: Mat2): Mat2 {
  return [
    [matrix[0][0], matrix[0][1]],
    [matrix[1][0], matrix[1][1]],
  ];
}
