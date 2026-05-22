import type { Camera, Mat2, Vec2, VectorItem } from "../app/types";
import { applyMat2 } from "../math/mat2";
import { parallelogramFromVectors } from "../math/parallelogram";
import { add, sub } from "../math/vec2";
import { worldToScreen } from "./camera";
import { drawHandle, drawVectorLabel } from "./drawLabels";

type ArrowOptions = {
  color: string;
  width: number;
  dashed?: boolean;
  alpha?: number;
};

export function drawVectorItems(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  vectors: VectorItem[],
  selectedVectorId: string | null,
): void {
  for (const vector of vectors) {
    const selected = vector.id === selectedVectorId;
    drawArrow(ctx, camera, { x: 0, y: 0 }, vector.value, {
      color: vector.color,
      width: selected ? 3.4 : 2.4,
    });
    drawHandle(ctx, camera, vector.value, selected ? "#172026" : vector.color);
    drawVectorLabel(ctx, camera, vector.value, vector.label, vector.color);
  }
}

export function drawSelectedTransformGhost(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  vector: VectorItem | null,
  matrix: Mat2,
): void {
  if (!vector) {
    return;
  }

  const image = applyMat2(matrix, vector.value);
  drawArrow(ctx, camera, { x: 0, y: 0 }, image, {
    color: "#1f6feb",
    width: 2.1,
    dashed: true,
    alpha: 0.68,
  });
  drawVectorLabel(ctx, camera, image, `A${vector.label}`, "#1f6feb");
}

export function drawGlobalVectorGhosts(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  vectors: VectorItem[],
  matrix: Mat2,
): void {
  for (const vector of vectors) {
    drawArrow(ctx, camera, { x: 0, y: 0 }, applyMat2(matrix, vector.value), {
      color: "#d79012",
      width: 1.6,
      dashed: true,
      alpha: 0.45,
    });
  }
}

export function drawPairConstruction(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  first: VectorItem | null,
  second: VectorItem | null,
): void {
  if (!first || !second) {
    return;
  }

  const sum = add(first.value, second.value);
  const difference = sub(first.value, second.value);

  drawPolygon(ctx, camera, parallelogramFromVectors(first.value, second.value), {
    fill: "rgba(247, 172, 40, 0.18)",
    stroke: "#d79012",
    width: 2,
  });

  drawArrow(ctx, camera, first.value, sum, {
    color: second.color,
    width: 1.6,
    dashed: true,
    alpha: 0.62,
  });
  drawArrow(ctx, camera, second.value, sum, {
    color: first.color,
    width: 1.6,
    dashed: true,
    alpha: 0.62,
  });
  drawArrow(ctx, camera, { x: 0, y: 0 }, sum, {
    color: "#7f57c2",
    width: 2.2,
    alpha: 0.9,
  });
  drawVectorLabel(ctx, camera, sum, `${first.label}+${second.label}`, "#6540a3");

  drawArrow(ctx, camera, { x: 0, y: 0 }, difference, {
    color: "#1f6feb",
    width: 1.9,
    dashed: true,
    alpha: 0.74,
  });
  drawVectorLabel(ctx, camera, difference, `${first.label}-${second.label}`, "#1f6feb");
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  start: Vec2,
  end: Vec2,
  options: ArrowOptions,
): void {
  const a = worldToScreen(camera, start);
  const b = worldToScreen(camera, end);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);

  ctx.save();
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.strokeStyle = options.color;
  ctx.fillStyle = options.color;
  ctx.lineWidth = options.width;
  ctx.lineCap = "round";
  if (options.dashed) {
    ctx.setLineDash([8, 7]);
  }

  if (length < 2) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, Math.max(3, options.width + 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const angle = Math.atan2(dy, dx);
  const headLength = 12;

  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(
    b.x - headLength * Math.cos(angle - Math.PI / 7),
    b.y - headLength * Math.sin(angle - Math.PI / 7),
  );
  ctx.lineTo(
    b.x - headLength * Math.cos(angle + Math.PI / 7),
    b.y - headLength * Math.sin(angle + Math.PI / 7),
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

type PolygonStyle = {
  fill: string;
  stroke: string;
  width: number;
};

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  points: Vec2[],
  style: PolygonStyle,
): void {
  if (points.length < 2) {
    return;
  }

  ctx.save();
  ctx.fillStyle = style.fill;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.width;

  const first = worldToScreen(camera, points[0]);
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);

  for (let index = 1; index < points.length; index += 1) {
    const screen = worldToScreen(camera, points[index]);
    ctx.lineTo(screen.x, screen.y);
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
