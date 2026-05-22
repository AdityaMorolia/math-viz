import type { Bounds, Camera, Mat2, Vec2 } from "../app/types";
import { applyMat2 } from "../math/mat2";
import { worldToScreen } from "./camera";

export function drawWorldGrid(ctx: CanvasRenderingContext2D, camera: Camera): void {
  const step = niceStep(52 / camera.scale);
  const minX = camera.center.x - camera.width / 2 / camera.scale;
  const maxX = camera.center.x + camera.width / 2 / camera.scale;
  const minY = camera.center.y - camera.height / 2 / camera.scale;
  const maxY = camera.center.y + camera.height / 2 / camera.scale;

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#e2e8eb";

  for (let x = Math.floor(minX / step) * step; x <= maxX; x += step) {
    const a = worldToScreen(camera, { x, y: minY });
    const b = worldToScreen(camera, { x, y: maxY });
    drawLine(ctx, a.x, a.y, b.x, b.y);
  }

  for (let y = Math.floor(minY / step) * step; y <= maxY; y += step) {
    const a = worldToScreen(camera, { x: minX, y });
    const b = worldToScreen(camera, { x: maxX, y });
    drawLine(ctx, a.x, a.y, b.x, b.y);
  }

  ctx.restore();
}

export function drawAxes(ctx: CanvasRenderingContext2D, camera: Camera): void {
  const minX = camera.center.x - camera.width / 2 / camera.scale;
  const maxX = camera.center.x + camera.width / 2 / camera.scale;
  const minY = camera.center.y - camera.height / 2 / camera.scale;
  const maxY = camera.center.y + camera.height / 2 / camera.scale;

  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#aebac1";

  const xAxisStart = worldToScreen(camera, { x: minX, y: 0 });
  const xAxisEnd = worldToScreen(camera, { x: maxX, y: 0 });
  drawLine(ctx, xAxisStart.x, xAxisStart.y, xAxisEnd.x, xAxisEnd.y);

  const yAxisStart = worldToScreen(camera, { x: 0, y: minY });
  const yAxisEnd = worldToScreen(camera, { x: 0, y: maxY });
  drawLine(ctx, yAxisStart.x, yAxisStart.y, yAxisEnd.x, yAxisEnd.y);

  ctx.restore();
}

export function drawTransformedGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  bounds: Bounds,
  matrix: Mat2,
): void {
  const step = niceStep(52 / camera.scale);
  const padding = step * 12;
  const minX = Math.floor((bounds.minX - padding) / step) * step;
  const maxX = Math.ceil((bounds.maxX + padding) / step) * step;
  const minY = Math.floor((bounds.minY - padding) / step) * step;
  const maxY = Math.ceil((bounds.maxY + padding) / step) * step;

  ctx.save();
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = "rgba(230, 126, 34, 0.25)";

  for (let x = minX; x <= maxX; x += step) {
    drawTransformedLine(ctx, camera, matrix, { x, y: minY }, { x, y: maxY });
  }

  for (let y = minY; y <= maxY; y += step) {
    drawTransformedLine(ctx, camera, matrix, { x: minX, y }, { x: maxX, y });
  }

  ctx.restore();
}

function drawTransformedLine(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  matrix: Mat2,
  start: Vec2,
  end: Vec2,
): void {
  const a = worldToScreen(camera, applyMat2(matrix, start));
  const b = worldToScreen(camera, applyMat2(matrix, end));
  drawLine(ctx, a.x, a.y, b.x, b.y);
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function niceStep(rawStep: number): number {
  const power = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / power;

  if (normalized <= 1) {
    return power;
  }
  if (normalized <= 2) {
    return 2 * power;
  }
  if (normalized <= 5) {
    return 5 * power;
  }
  return 10 * power;
}
