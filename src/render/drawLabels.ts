import type { Camera, Vec2 } from "../app/types";
import { worldToScreen } from "./camera";

export function drawVectorLabel(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  vector: Vec2,
  label: string,
  color: string,
): void {
  const screen = worldToScreen(camera, vector);
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.fillText(label, screen.x + 9, screen.y - 9);
  ctx.restore();
}

export function drawHandle(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  point: Vec2,
  color: string,
): void {
  const screen = worldToScreen(camera, point);
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
