import type { AppState, Mat2 } from "../app/types";
import { getPairVectors, getScalarVector, getSelectedVector } from "../app/state";
import { realEigenpairs2 } from "../math/eigen";
import { IDENTITY_2, isIdentityMat2, lerpMat2 } from "../math/mat2";
import { createBlochRenderer } from "./blochSphere";
import { getVisibleWorldBounds, makeCameraFromState } from "./camera";
import { drawComplexConstructions, drawComplexItems } from "./drawComplex";
import { drawAxes, drawAxisCoordinateLabels, drawTransformedGrid, drawWorldGrid } from "./drawGrid";
import {
  drawComponentLegs,
  drawEigenConstruction,
  drawGlobalVectorGhosts,
  drawPairConstruction,
  drawScalarPreview,
  drawVectorItems,
} from "./drawVectors";

export type Renderer = {
  redraw: () => void;
};

export function createRenderer(
  canvas: HTMLCanvasElement,
  blochRoot: HTMLElement,
  state: AppState,
): Renderer {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create 2D canvas context.");
  }
  const blochRenderer = createBlochRenderer(blochRoot, state);

  function redraw(): void {
    const qubitMode = state.mode === "qubit";
    canvas.classList.toggle("hidden", qubitMode);
    blochRenderer.setVisible(qubitMode);
    if (qubitMode) {
      blochRenderer.render();
      return;
    }

    const { width, height } = resizeCanvas(canvas, ctx);
    const camera = makeCameraFromState(state, width, height);
    const bounds = getVisibleWorldBounds(camera);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f7f9fa";
    ctx.fillRect(0, 0, width, height);

    drawWorldGrid(ctx, camera);
    drawAxes(ctx, camera);
    if (state.showAxisCoordinates) {
      drawAxisCoordinateLabels(ctx, camera, state.mode === "complex");
    }

    if (state.mode === "algebra") {
      const [firstPairVector, secondPairVector] = getPairVectors(state);
      drawPairConstruction(ctx, camera, firstPairVector, secondPairVector);
      if (state.showComponentLegs) {
        drawComponentLegs(ctx, camera, getSelectedVector(state));
      }
      drawScalarPreview(ctx, camera, getScalarVector(state), state.scalarMultiplier);
      drawVectorItems(ctx, camera, state.vectors, state.selectedVectorId);
      return;
    }

    if (state.mode === "complex") {
      drawComplexConstructions(ctx, camera, state);
      drawComplexItems(ctx, camera, state.complexNumbers, state.selectedComplexId);
      return;
    }

    if (state.mode === "geometry") {
      const interpolatedMatrix = lerpMat2(IDENTITY_2, state.transformMatrix, state.transformT);
      drawTransformedGridWhenVisible(ctx, camera, bounds, interpolatedMatrix);
      if (!isIdentityMat2(interpolatedMatrix)) {
        drawGlobalVectorGhosts(ctx, camera, state.vectors, interpolatedMatrix);
      }
      drawVectorItems(ctx, camera, state.vectors, state.selectedVectorId);
      return;
    }

    drawTransformedGridWhenVisible(ctx, camera, bounds, state.transformMatrix);
    drawEigenConstruction(ctx, camera, state.transformMatrix, realEigenpairs2(state.transformMatrix));
    drawVectorItems(ctx, camera, state.vectors, state.selectedVectorId);
  }

  return { redraw };
}

function drawTransformedGridWhenVisible(
  ctx: CanvasRenderingContext2D,
  camera: ReturnType<typeof makeCameraFromState>,
  bounds: ReturnType<typeof getVisibleWorldBounds>,
  matrix: Mat2,
): void {
  if (!isIdentityMat2(matrix)) {
    drawTransformedGrid(ctx, camera, bounds, matrix);
  }
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): { width: number; height: number } {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const targetWidth = Math.floor(width * dpr);
  const targetHeight = Math.floor(height * dpr);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}
