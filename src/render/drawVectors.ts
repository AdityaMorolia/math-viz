import type { Camera, Mat2, Vec2, VectorItem } from "../app/types";
import type { RealEigenResult } from "../math/eigen";
import { applyMat2 } from "../math/mat2";
import { parallelogramFromVectors } from "../math/parallelogram";
import { add, scale, sub } from "../math/vec2";
import { worldToScreen } from "./camera";
import { drawHandle, drawVectorLabel } from "./drawLabels";

type ArrowOptions = {
  color: string;
  width: number;
  dashed?: boolean;
  alpha?: number;
};

const EIGEN_COLORS = ["#008da6", "#d62f7f"];

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

export function drawComponentLegs(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  vector: VectorItem | null,
): void {
  if (!vector) {
    return;
  }

  const xLeg = { x: vector.value.x, y: 0 };
  drawArrow(ctx, camera, { x: 0, y: 0 }, xLeg, {
    color: "#7a8992",
    width: 1.5,
    dashed: true,
    alpha: 0.72,
  });
  drawArrow(ctx, camera, xLeg, vector.value, {
    color: "#7a8992",
    width: 1.5,
    dashed: true,
    alpha: 0.72,
  });
}

export function drawScalarPreview(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  vector: VectorItem | null,
  multiplier: number,
): void {
  if (!vector || Math.abs(multiplier - 1) < 1e-10) {
    return;
  }

  const scaled = scale(vector.value, multiplier);
  drawArrow(ctx, camera, { x: 0, y: 0 }, scaled, {
    color: "#7f57c2",
    width: 2,
    dashed: true,
    alpha: 0.78,
  });
  drawVectorLabel(ctx, camera, scaled, `k${vector.label}`, "#6540a3");
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

export function drawEigenConstruction(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  matrix: Mat2,
  result: RealEigenResult,
): void {
  if (result.kind === "none-real") {
    return;
  }

  if (result.kind === "every-direction") {
    drawEveryDirectionGuide(ctx, camera);
    return;
  }

  result.eigenpairs.forEach((pair, index) => {
    const color = EIGEN_COLORS[index % EIGEN_COLORS.length];
    drawEigenLine(ctx, camera, pair.vector, color);

    const base = scale(pair.vector, 1.15);
    const image = applyMat2(matrix, base);
    drawArrow(ctx, camera, { x: 0, y: 0 }, image, {
      color,
      width: 2.1,
      dashed: true,
      alpha: 0.82,
    });
    drawVectorLabel(ctx, camera, image, `A e${index + 1}`, color);
  });
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

function drawEigenLine(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  direction: Vec2,
  color: string,
): void {
  const span = Math.hypot(camera.width, camera.height) / camera.scale;
  drawWorldLine(ctx, camera, scale(direction, -span), scale(direction, span), {
    color,
    width: 2,
    alpha: 0.42,
  });
}

function drawEveryDirectionGuide(ctx: CanvasRenderingContext2D, camera: Camera): void {
  const span = Math.hypot(camera.width, camera.height) / camera.scale;
  const color = "#008da6";

  for (let index = 0; index < 6; index += 1) {
    const angle = (index * Math.PI) / 6;
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    drawWorldLine(ctx, camera, scale(direction, -span), scale(direction, span), {
      color,
      width: 1.5,
      alpha: 0.24,
    });
  }

  drawVectorLabel(ctx, camera, { x: 1.15, y: 0 }, "every direction", color);
}

type LineStyle = {
  color: string;
  width: number;
  alpha: number;
};

function drawWorldLine(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  start: Vec2,
  end: Vec2,
  style: LineStyle,
): void {
  const a = worldToScreen(camera, start);
  const b = worldToScreen(camera, end);

  ctx.save();
  ctx.globalAlpha = style.alpha;
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}
