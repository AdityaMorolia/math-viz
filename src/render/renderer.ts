import type { AppState, Mat2 } from "../app/types";
import { getPairVectors, getSelectedVector } from "../app/state";
import { getVisibleWorldBounds, makeCameraFromState } from "./camera";
import { drawAxes, drawTransformedGrid, drawWorldGrid } from "./drawGrid";
import {
  drawGlobalVectorGhosts,
  drawPairConstruction,
  drawSelectedTransformGhost,
  drawVectorItems,
} from "./drawVectors";

export type Renderer = {
  redraw: () => void;
};

export function createRenderer(canvas: HTMLCanvasElement, state: AppState): Renderer {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create 2D canvas context.");
  }

  function redraw(): void {
    const { width, height } = resizeCanvas(canvas, ctx);
    const camera = makeCameraFromState(state, width, height);
    const bounds = getVisibleWorldBounds(camera);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f7f9fa";
    ctx.fillRect(0, 0, width, height);

    const showGlobalTransform = !isIdentityMatrix(state.globalTransform);

    drawWorldGrid(ctx, camera);
    if (showGlobalTransform) {
      drawTransformedGrid(ctx, camera, bounds, state.globalTransform);
    }
    drawAxes(ctx, camera);

    const [firstPairVector, secondPairVector] = getPairVectors(state);
    drawPairConstruction(ctx, camera, firstPairVector, secondPairVector);
    if (showGlobalTransform) {
      drawGlobalVectorGhosts(ctx, camera, state.vectors, state.globalTransform);
    }
    drawSelectedTransformGhost(ctx, camera, getSelectedVector(state), state.selectedTransform);
    drawVectorItems(ctx, camera, state.vectors, state.selectedVectorId);
  }

  return { redraw };
}

function isIdentityMatrix(matrix: Mat2): boolean {
  return (
    Math.abs(matrix[0][0] - 1) < 1e-10 &&
    Math.abs(matrix[0][1]) < 1e-10 &&
    Math.abs(matrix[1][0]) < 1e-10 &&
    Math.abs(matrix[1][1] - 1) < 1e-10
  );
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
