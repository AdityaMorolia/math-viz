export type Vec2 = {
  x: number;
  y: number;
};

export type Mat2 = [[number, number], [number, number]];

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
  vectors: VectorItem[];
  selectedVectorId: string | null;
  selectedTransform: Mat2;
  globalTransform: Mat2;
  pairSelection: PairSelection;
  zoomOut: number;
  pan: Vec2;
  nextVectorNumber: number;
};
