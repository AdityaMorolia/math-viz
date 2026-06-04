import type {
  AppState,
  ComplexConcepts,
  ComplexItem,
  DojoMode,
  Mat2,
  PairSelection,
  Vec2,
  VectorItem,
} from "./types";
import { copyMat2 } from "../math/mat2";

export const VECTOR_COLORS = [
  "#d13f31",
  "#1f7a4d",
  "#1f6feb",
  "#d79012",
  "#7f57c2",
  "#008da6",
  "#d62f7f",
];

const VECTOR_LABELS = ["u", "v", "w"];
const COMPLEX_LABELS = ["z", "w", "a", "b"];
const DEFAULT_ZOOM_OUT = 0;

const IDENTITY: Mat2 = [
  [1, 0],
  [0, 1],
];

export function createInitialState(): AppState {
  return {
    mode: "algebra",
    vectors: [
      {
        id: "v1",
        label: labelForVectorNumber(1),
        value: { x: 1, y: 0.5 },
        color: VECTOR_COLORS[0],
      },
    ],
    selectedVectorId: "v1",
    transformMatrix: copyMat2(IDENTITY),
    transformT: 1,
    scalarMultiplier: 1,
    scalarVectorId: null,
    showComponentLegs: true,
    pairSelection: {
      firstId: null,
      secondId: null,
    },
    complexNumbers: [
      {
        id: "c1",
        label: labelForComplexNumber(1),
        value: { x: 1, y: 1 },
        color: VECTOR_COLORS[0],
      },
    ],
    selectedComplexId: "c1",
    complexConcepts: {
      addition: false,
      multiplication: false,
      conjugate: false,
      rotation: false,
      polar: false,
    },
    complexAdditionSelection: {
      firstId: null,
      secondId: null,
    },
    complexMultiplicationSelection: {
      firstId: null,
      secondId: null,
    },
    complexUnaryId: null,
    complexRotationTheta: Math.PI / 4,
    nextComplexNumber: 2,
    showAxisCoordinates: false,
    zoomOut: DEFAULT_ZOOM_OUT,
    pan: { x: 0, y: 0 },
    nextVectorNumber: 2,
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

export function getScalarVector(state: AppState): VectorItem | null {
  return getVector(state, state.scalarVectorId);
}

export function getPairVectors(state: AppState): [VectorItem | null, VectorItem | null] {
  const first = getVector(state, state.pairSelection.firstId);
  const second = getVector(state, state.pairSelection.secondId);

  if (first && second && first.id === second.id) {
    return [first, null];
  }

  return [first, second];
}

export function getComplexNumber(state: AppState, id: string | null): ComplexItem | null {
  if (!id) {
    return null;
  }
  return state.complexNumbers.find((number) => number.id === id) ?? null;
}

export function getSelectedComplexNumber(state: AppState): ComplexItem | null {
  return getComplexNumber(state, state.selectedComplexId);
}

export function getComplexUnaryNumber(state: AppState): ComplexItem | null {
  return getComplexNumber(state, state.complexUnaryId);
}

export function getComplexAdditionNumbers(
  state: AppState,
): [ComplexItem | null, ComplexItem | null] {
  return getDistinctComplexPair(state, state.complexAdditionSelection);
}

export function getComplexMultiplicationNumbers(
  state: AppState,
): [ComplexItem | null, ComplexItem | null] {
  return getDistinctComplexPair(state, state.complexMultiplicationSelection);
}

export function addVector(state: AppState): VectorItem {
  const vectorNumber = state.nextVectorNumber;
  const angle = ((vectorNumber - 1) * Math.PI * 2) / 7;
  const vector: VectorItem = {
    id: `v${vectorNumber}`,
    label: labelForVectorNumber(vectorNumber),
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

export function addComplexNumber(state: AppState): ComplexItem {
  const number = state.nextComplexNumber;
  const angle = ((number - 1) * Math.PI * 2) / 9;
  const item: ComplexItem = {
    id: `c${number}`,
    label: labelForComplexNumber(number),
    value: {
      x: Math.cos(angle) * 1.2,
      y: Math.sin(angle) * 1.2,
    },
    color: VECTOR_COLORS[(number - 1) % VECTOR_COLORS.length],
  };

  state.nextComplexNumber += 1;
  state.complexNumbers.push(item);
  state.selectedComplexId = item.id;
  normalizeStateRefs(state);
  return item;
}

export function deleteVector(state: AppState, id: string): void {
  state.vectors = state.vectors.filter((vector) => vector.id !== id);
  normalizeStateRefs(state);
}

export function deleteComplexNumber(state: AppState, id: string): void {
  state.complexNumbers = state.complexNumbers.filter((number) => number.id !== id);
  normalizeStateRefs(state);
}

export function setSelectedVector(state: AppState, id: string | null): void {
  state.selectedVectorId = getVector(state, id) ? id : (state.vectors[0]?.id ?? null);
}

export function setSelectedComplexNumber(state: AppState, id: string | null): void {
  state.selectedComplexId = getComplexNumber(state, id)
    ? id
    : (state.complexNumbers[0]?.id ?? null);
}

export function updateVectorValue(state: AppState, id: string, value: Vec2): void {
  const vector = getVector(state, id);
  if (vector) {
    vector.value = value;
  }
}

export function updateComplexValue(state: AppState, id: string, value: Vec2): void {
  const number = getComplexNumber(state, id);
  if (number) {
    number.value = value;
  }
}

export function setMode(state: AppState, mode: DojoMode): void {
  state.mode = mode;
}

export function setTransformMatrix(state: AppState, transform: Mat2): void {
  state.transformMatrix = copyMat2(transform);
}

export function setTransformT(state: AppState, value: number): void {
  state.transformT = clamp(value, 0, 1);
}

export function setScalarMultiplier(state: AppState, value: number): void {
  state.scalarMultiplier = clamp(value, -3, 3);
}

export function setScalarVector(state: AppState, id: string | null): void {
  state.scalarVectorId = getVector(state, id) ? id : null;
}

export function setShowComponentLegs(state: AppState, value: boolean): void {
  state.showComponentLegs = value;
}

export function setPairVector(
  state: AppState,
  which: keyof AppState["pairSelection"],
  id: string | null,
): void {
  const nextId = getVector(state, id) ? id : null;
  state.pairSelection[which] = nextId;

  if (nextId) {
    const other = which === "firstId" ? "secondId" : "firstId";
    if (state.pairSelection[other] === nextId) {
      state.pairSelection[other] = null;
    }
  }
}

export function setComplexConcept(
  state: AppState,
  concept: keyof ComplexConcepts,
  enabled: boolean,
): void {
  state.complexConcepts[concept] = enabled;
}

export function setComplexAdditionNumber(
  state: AppState,
  which: keyof PairSelection,
  id: string | null,
): void {
  setComplexPairNumber(state, state.complexAdditionSelection, which, id);
}

export function setComplexMultiplicationNumber(
  state: AppState,
  which: keyof PairSelection,
  id: string | null,
): void {
  setComplexPairNumber(state, state.complexMultiplicationSelection, which, id);
}

export function setComplexUnaryNumber(state: AppState, id: string | null): void {
  state.complexUnaryId = getComplexNumber(state, id) ? id : null;
}

export function setComplexRotationTheta(state: AppState, value: number): void {
  state.complexRotationTheta = clamp(value, -Math.PI, Math.PI);
}

export function setShowAxisCoordinates(state: AppState, value: boolean): void {
  state.showAxisCoordinates = value;
}

export function setZoomOut(state: AppState, value: number): void {
  state.zoomOut = value;
}

export function resetView(state: AppState): void {
  state.zoomOut = DEFAULT_ZOOM_OUT;
  state.pan = { x: 0, y: 0 };
}

function normalizeStateRefs(state: AppState): void {
  const firstId = state.vectors[0]?.id ?? null;
  const firstComplexId = state.complexNumbers[0]?.id ?? null;

  if (!getVector(state, state.selectedVectorId)) {
    state.selectedVectorId = firstId;
  }

  if (!getVector(state, state.pairSelection.firstId)) {
    state.pairSelection.firstId = null;
  }

  if (!getVector(state, state.pairSelection.secondId)) {
    state.pairSelection.secondId = null;
  }

  if (
    state.pairSelection.firstId &&
    state.pairSelection.firstId === state.pairSelection.secondId
  ) {
    state.pairSelection.secondId = null;
  }

  if (!getVector(state, state.scalarVectorId)) {
    state.scalarVectorId = null;
  }

  if (!getComplexNumber(state, state.selectedComplexId)) {
    state.selectedComplexId = firstComplexId;
  }

  normalizeComplexPair(state, state.complexAdditionSelection);
  normalizeComplexPair(state, state.complexMultiplicationSelection);

  if (!getComplexNumber(state, state.complexUnaryId)) {
    state.complexUnaryId = null;
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function labelForVectorNumber(vectorNumber: number): string {
  return VECTOR_LABELS[vectorNumber - 1] ?? `v${vectorNumber}`;
}

function labelForComplexNumber(number: number): string {
  return COMPLEX_LABELS[number - 1] ?? `c${number - COMPLEX_LABELS.length}`;
}

function getDistinctComplexPair(
  state: AppState,
  selection: PairSelection,
): [ComplexItem | null, ComplexItem | null] {
  const first = getComplexNumber(state, selection.firstId);
  const second = getComplexNumber(state, selection.secondId);

  if (first && second && first.id === second.id) {
    return [first, null];
  }

  return [first, second];
}

function setComplexPairNumber(
  state: AppState,
  selection: PairSelection,
  which: keyof PairSelection,
  id: string | null,
): void {
  const nextId = getComplexNumber(state, id) ? id : null;
  selection[which] = nextId;

  if (nextId) {
    const other = which === "firstId" ? "secondId" : "firstId";
    if (selection[other] === nextId) {
      selection[other] = null;
    }
  }
}

function normalizeComplexPair(state: AppState, selection: PairSelection): void {
  if (!getComplexNumber(state, selection.firstId)) {
    selection.firstId = null;
  }

  if (!getComplexNumber(state, selection.secondId)) {
    selection.secondId = null;
  }

  if (selection.firstId && selection.firstId === selection.secondId) {
    selection.secondId = null;
  }
}
