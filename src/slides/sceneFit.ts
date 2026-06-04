import {
  getComplexAdditionNumbers,
  getComplexMultiplicationNumbers,
  getComplexUnaryNumber,
  getPairVectors,
  getScalarVector,
  setZoomOut,
} from "../app/state";
import type { AppState, Bounds, Vec2 } from "../app/types";
import {
  addComplex,
  conjugateComplex,
  modulus,
  multiplyComplex,
  rotateByAngle,
} from "../math/complex";
import { applyMat2, IDENTITY_2, lerpMat2 } from "../math/mat2";
import { scale } from "../math/vec2";
import { BASE_SCALE } from "../render/camera";
import type { SceneFitSpec } from "./deck";

export function fitCanvasToScene(
  canvas: HTMLCanvasElement,
  state: AppState,
  fitSpec: SceneFitSpec | null,
): void {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

  const spec = fitSpec ?? {};
  const explicitBounds = resolveFitBounds(spec);
  const bounds = expandBoundsToMinSpan(
    explicitBounds ?? computeSceneBounds(state),
    spec.minWorldSpan ?? 1.85,
  );
  const worldWidth = Math.max(0.01, bounds.maxX - bounds.minX);
  const worldHeight = Math.max(0.01, bounds.maxY - bounds.minY);
  const paddingFactor = spec.padding ?? 0.84;
  const rawScale = Math.min(rect.width / worldWidth, rect.height / worldHeight) * paddingFactor;
  const nextScale = clamp(rawScale, spec.minScale ?? 64, spec.maxScale ?? 260);

  state.pan = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
  setZoomOut(state, Math.log2(BASE_SCALE / nextScale));
}

function resolveFitBounds(spec: SceneFitSpec): Bounds | null {
  if (!spec.bounds) {
    return null;
  }

  return typeof spec.bounds === "function" ? spec.bounds() : spec.bounds;
}

function computeSceneBounds(appState: AppState): Bounds {
  const builder = createBoundsBuilder();
  includePoint(builder, { x: 0, y: 0 });

  if (appState.mode === "complex") {
    includeComplexBounds(builder, appState);
  } else {
    includeVectorBounds(builder, appState);
  }

  return builder.seen ? builder : { minX: -1, maxX: 1, minY: -1, maxY: 1 };
}

function includeVectorBounds(builder: BoundsBuilder, appState: AppState): void {
  for (const vector of appState.vectors) {
    includePoint(builder, vector.value);
  }

  const [first, second] = getPairVectors(appState);
  if (first && second) {
    includePoint(builder, addVec2(first.value, second.value));
    includePoint(builder, { x: first.value.x - second.value.x, y: first.value.y - second.value.y });
  }

  const scalarVector = getScalarVector(appState);
  if (scalarVector) {
    includePoint(builder, scale(scalarVector.value, appState.scalarMultiplier));
  }

  if (appState.mode === "geometry" || appState.mode === "eigenvectors") {
    const matrix =
      appState.mode === "geometry"
        ? lerpMat2(IDENTITY_2, appState.transformMatrix, appState.transformT)
        : appState.transformMatrix;

    for (const vector of appState.vectors) {
      includePoint(builder, applyMat2(matrix, vector.value));
    }

    const focusPoints: Vec2[] = [
      { x: -1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: 1.4, y: 0 },
      { x: -1.4, y: 0 },
      { x: 0, y: 1.4 },
      { x: 0, y: -1.4 },
    ];

    for (const point of focusPoints) {
      includePoint(builder, point);
      includePoint(builder, applyMat2(matrix, point));
    }
  }
}

function includeComplexBounds(builder: BoundsBuilder, appState: AppState): void {
  for (const number of appState.complexNumbers) {
    includePoint(builder, number.value);
  }

  if (appState.complexConcepts.addition) {
    const [first, second] = getComplexAdditionNumbers(appState);
    if (first && second) {
      includePoint(builder, addComplex(first.value, second.value));
    }
  }

  if (appState.complexConcepts.multiplication) {
    const [first, second] = getComplexMultiplicationNumbers(appState);
    if (first && second) {
      includePoint(builder, multiplyComplex(first.value, second.value));
    }
  }

  const unary = getComplexUnaryNumber(appState);
  if (!unary) {
    return;
  }

  if (appState.complexConcepts.conjugate) {
    includePoint(builder, conjugateComplex(unary.value));
  }

  if (appState.complexConcepts.rotation) {
    includePoint(builder, rotateByAngle(unary.value, appState.complexRotationTheta));
  }

  if (appState.complexConcepts.polar) {
    const radius = modulus(unary.value);
    includePoint(builder, { x: radius, y: radius });
    includePoint(builder, { x: -radius, y: -radius });
  }
}

type BoundsBuilder = Bounds & {
  seen: boolean;
};

function createBoundsBuilder(): BoundsBuilder {
  return {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
    seen: false,
  };
}

function includePoint(bounds: BoundsBuilder, point: Vec2): void {
  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.maxY = Math.max(bounds.maxY, point.y);
  bounds.seen = true;
}

function addVec2(first: Vec2, second: Vec2): Vec2 {
  return {
    x: first.x + second.x,
    y: first.y + second.y,
  };
}

function expandBoundsToMinSpan(bounds: Bounds, minSpan: number): Bounds {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const nextWidth = Math.max(width, minSpan);
  const nextHeight = Math.max(height, minSpan);

  return {
    minX: centerX - nextWidth / 2,
    maxX: centerX + nextWidth / 2,
    minY: centerY - nextHeight / 2,
    maxY: centerY + nextHeight / 2,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
