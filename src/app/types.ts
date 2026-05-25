export type Vec2 = {
  x: number;
  y: number;
};

export type Mat2 = [[number, number], [number, number]];

export type DojoMode = "algebra" | "geometry" | "eigenvectors" | "complex" | "qubit";

export type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type Camera = {
  width: number;
  height: number;
  scale: number;
  center: Vec2;
};

export type VectorItem = {
  id: string;
  label: string;
  value: Vec2;
  color: string;
};

export type ComplexItem = {
  id: string;
  label: string;
  value: Vec2;
  color: string;
};

export type PairSelection = {
  firstId: string | null;
  secondId: string | null;
};

export type ComplexConcepts = {
  addition: boolean;
  multiplication: boolean;
  conjugate: boolean;
  rotation: boolean;
  polar: boolean;
};

export type QubitRotationAngles = {
  x: number;
  y: number;
  z: number;
};

export type QubitGate = "X" | "Y" | "Z" | "H" | "S" | "T";

export type QubitPreset = "zero" | "one" | "plus" | "minus" | "i-plus" | "i-minus";

export type AppState = {
  mode: DojoMode;
  vectors: VectorItem[];
  selectedVectorId: string | null;
  transformMatrix: Mat2;
  transformT: number;
  scalarMultiplier: number;
  scalarVectorId: string | null;
  showComponentLegs: boolean;
  pairSelection: PairSelection;
  complexNumbers: ComplexItem[];
  selectedComplexId: string | null;
  complexConcepts: ComplexConcepts;
  complexAdditionSelection: PairSelection;
  complexMultiplicationSelection: PairSelection;
  complexUnaryId: string | null;
  complexRotationTheta: number;
  nextComplexNumber: number;
  qubitAlpha: Vec2;
  qubitBeta: Vec2;
  qubitRotationAngles: QubitRotationAngles;
  showAxisCoordinates: boolean;
  zoomOut: number;
  pan: Vec2;
  nextVectorNumber: number;
};
