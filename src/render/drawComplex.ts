import type { AppState, Camera, ComplexItem, Vec2 } from "../app/types";
import {
  getComplexAdditionNumbers,
  getComplexMultiplicationNumbers,
  getComplexUnaryNumber,
} from "../app/state";
import {
  addComplex,
  argument,
  conjugateComplex,
  modulus,
  multiplyComplex,
  normalizeAngle,
  radiansToDegrees,
  rotateByAngle,
} from "../math/complex";
import { parallelogramFromVectors } from "../math/parallelogram";
import { scale } from "../math/vec2";
import { worldToScreen } from "./camera";
import { drawArrow } from "./drawVectors";
import { drawHandle, drawVectorLabel } from "./drawLabels";

type LineStyle = {
  color: string;
  width: number;
  alpha: number;
  dashed?: boolean;
};

const ADDITION_COLOR = "#7f57c2";
const MULTIPLICATION_COLOR = "#d79012";
const CONJUGATE_COLOR = "#1f6feb";
const ROTATION_COLOR = "#008da6";
const POLAR_COLOR = "#65737d";

export function drawComplexItems(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  numbers: ComplexItem[],
  selectedComplexId: string | null,
): void {
  for (const number of numbers) {
    const selected = number.id === selectedComplexId;
    drawArrow(ctx, camera, { x: 0, y: 0 }, number.value, {
      color: number.color,
      width: selected ? 3.4 : 2.4,
    });
    drawHandle(ctx, camera, number.value, selected ? "#172026" : number.color);
    drawVectorLabel(ctx, camera, number.value, number.label, number.color);
  }
}

export function drawComplexConstructions(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  state: AppState,
): void {
  if (state.complexConcepts.addition) {
    drawComplexAddition(ctx, camera, state);
  }

  if (state.complexConcepts.multiplication) {
    drawComplexMultiplication(ctx, camera, state);
  }

  const unary = getComplexUnaryNumber(state);
  if (!unary) {
    return;
  }

  if (state.complexConcepts.conjugate) {
    drawComplexConjugate(ctx, camera, unary);
  }

  if (state.complexConcepts.rotation) {
    drawComplexRotation(ctx, camera, unary, state.complexRotationTheta);
  }

  if (state.complexConcepts.polar) {
    drawComplexPolar(ctx, camera, unary);
  }
}

function drawComplexAddition(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  state: AppState,
): void {
  const [first, second] = getComplexAdditionNumbers(state);
  if (!first || !second) {
    return;
  }

  const sum = addComplex(first.value, second.value);
  drawPolygon(ctx, camera, parallelogramFromVectors(first.value, second.value), {
    fill: "rgba(127, 87, 194, 0.14)",
    stroke: ADDITION_COLOR,
    width: 2,
  });
  drawArrow(ctx, camera, first.value, sum, {
    color: second.color,
    width: 1.5,
    dashed: true,
    alpha: 0.62,
  });
  drawArrow(ctx, camera, second.value, sum, {
    color: first.color,
    width: 1.5,
    dashed: true,
    alpha: 0.62,
  });
  drawArrow(ctx, camera, { x: 0, y: 0 }, sum, {
    color: ADDITION_COLOR,
    width: 2.2,
    alpha: 0.9,
  });
  drawVectorLabel(ctx, camera, sum, `${first.label}+${second.label}`, ADDITION_COLOR);
}

function drawComplexMultiplication(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  state: AppState,
): void {
  const [first, second] = getComplexMultiplicationNumbers(state);
  if (!first || !second) {
    return;
  }

  const product = multiplyComplex(first.value, second.value);
  drawWorldLine(ctx, camera, { x: 0, y: 0 }, first.value, {
    color: first.color,
    width: 1.4,
    alpha: 0.28,
    dashed: true,
  });
  drawWorldLine(ctx, camera, { x: 0, y: 0 }, second.value, {
    color: second.color,
    width: 1.4,
    alpha: 0.28,
    dashed: true,
  });
  drawArrow(ctx, camera, { x: 0, y: 0 }, product, {
    color: MULTIPLICATION_COLOR,
    width: 2.3,
    alpha: 0.92,
  });
  drawVectorLabel(ctx, camera, product, `${first.label}${second.label}`, MULTIPLICATION_COLOR);
}

function drawComplexConjugate(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  number: ComplexItem,
): void {
  const reflected = conjugateComplex(number.value);
  drawWorldLine(ctx, camera, number.value, reflected, {
    color: CONJUGATE_COLOR,
    width: 1.5,
    alpha: 0.42,
    dashed: true,
  });
  drawArrow(ctx, camera, { x: 0, y: 0 }, reflected, {
    color: CONJUGATE_COLOR,
    width: 2,
    dashed: true,
    alpha: 0.82,
  });
  drawVectorLabel(ctx, camera, reflected, `conj(${number.label})`, CONJUGATE_COLOR);
}

function drawComplexRotation(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  number: ComplexItem,
  theta: number,
): void {
  const rotated = rotateByAngle(number.value, theta);
  drawArrow(ctx, camera, { x: 0, y: 0 }, rotated, {
    color: ROTATION_COLOR,
    width: 2.2,
    alpha: 0.9,
  });
  const thetaLabel = formatAngleLabel(theta);
  drawVectorLabel(ctx, camera, rotated, `${number.label}e^(i${thetaLabel})`, ROTATION_COLOR);
  drawAngleArc(
    ctx,
    camera,
    argument(number.value),
    argument(number.value) + theta,
    ROTATION_COLOR,
    thetaLabel,
  );
}

function drawComplexPolar(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  number: ComplexItem,
): void {
  const radius = modulus(number.value);
  if (radius < 1e-10) {
    return;
  }

  drawWorldCircle(ctx, camera, radius, POLAR_COLOR, 0.22);
  const theta = argument(number.value);
  const thetaLabel = formatAngleLabel(theta);
  const xLeg = { x: number.value.x, y: 0 };
  drawWorldLine(ctx, camera, { x: 0, y: 0 }, xLeg, {
    color: POLAR_COLOR,
    width: 1.4,
    alpha: 0.48,
    dashed: true,
  });
  drawWorldLine(ctx, camera, xLeg, number.value, {
    color: POLAR_COLOR,
    width: 1.4,
    alpha: 0.48,
    dashed: true,
  });
  drawAngleArc(ctx, camera, 0, theta, POLAR_COLOR, thetaLabel);
  drawVectorLabel(ctx, camera, scale(number.value, 0.52), "r", POLAR_COLOR);
  drawVectorLabel(
    ctx,
    camera,
    { x: number.value.x / 2, y: -0.14 },
    `r cos(${thetaLabel})`,
    POLAR_COLOR,
  );
  drawVectorLabel(
    ctx,
    camera,
    { x: number.value.x + 0.08, y: number.value.y / 2 },
    `r sin(${thetaLabel})`,
    POLAR_COLOR,
  );
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
  if (style.dashed) {
    ctx.setLineDash([7, 7]);
  }
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function drawWorldCircle(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  radius: number,
  color: string,
  alpha: number,
): void {
  const center = worldToScreen(camera, { x: 0, y: 0 });
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius * camera.scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawAngleArc(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  startAngle: number,
  endAngle: number,
  color: string,
  label: string,
): void {
  if (Math.abs(endAngle - startAngle) < 1e-10) {
    return;
  }

  const radius = 0.48;
  const center = worldToScreen(camera, { x: 0, y: 0 });
  const labelAngle = startAngle + (endAngle - startAngle) / 2;
  const labelPoint = {
    x: Math.cos(labelAngle) * (radius + 0.12),
    y: Math.sin(labelAngle) * (radius + 0.12),
  };

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(
    center.x,
    center.y,
    radius * camera.scale,
    -startAngle,
    -endAngle,
    endAngle > startAngle,
  );
  ctx.stroke();
  ctx.restore();

  drawVectorLabel(ctx, camera, labelPoint, label, color);
}

function formatAngleLabel(radians: number): string {
  return `${Number(radiansToDegrees(normalizeAngle(radians)).toFixed(0)).toString()} deg`;
}
