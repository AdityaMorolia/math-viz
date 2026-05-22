export type Vec2 = {
  x: number;
  y: number;
};

export type Mat2 = [[number, number], [number, number]];

export type DojoMode = "algebra" | "geometry" | "eigenvectors";

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

export type PairSelection = {
  firstId: string;
  secondId: string;
};

export type AppState = {
  mode: DojoMode;
  vectors: VectorItem[];
  selectedVectorId: string | null;
  transformMatrix: Mat2;
  transformT: number;
  scalarMultiplier: number;
  showComponentLegs: boolean;
  pairSelection: PairSelection;
  zoomOut: number;
  pan: Vec2;
  nextVectorNumber: number;
};
