import {
  getPairVectors,
  getScalarVector,
  getSelectedComplexNumber,
  getSelectedVector,
} from "../app/state";
import type { AppState, ComplexItem, Mat2, Vec2, VectorItem } from "../app/types";
import { addComplex, argument, modulus, multiplyComplex, radiansToDegrees } from "../math/complex";
import { applyMat2, det2, mat2FromColumns } from "../math/mat2";
import { scale } from "../math/vec2";
import type { ReadoutKind } from "./deck";

export function renderReadout(state: AppState, kind: ReadoutKind): string {
  if (kind === "pair" || kind === "linear-combo") {
    const [first, second] = getPairVectors(state);
    if (!first || !second) {
      return readoutRows([["pair", "choose two vectors"]]);
    }
    const sum = { x: first.value.x + second.value.x, y: first.value.y + second.value.y };
    return readoutRows([
      [`${first.label}+${second.label}`, formatVec(sum)],
      [
        `${first.label}-${second.label}`,
        formatVec({ x: first.value.x - second.value.x, y: first.value.y - second.value.y }),
      ],
    ]);
  }

  if (kind === "scalar") {
    const vector = getScalarVector(state);
    if (!vector) {
      return readoutRows([["scaled", "n/a"]]);
    }
    return readoutRows([
      ["k", formatNumber(state.scalarMultiplier)],
      [`k${vector.label}`, formatVec(scale(vector.value, state.scalarMultiplier))],
    ]);
  }

  if (kind === "complex") {
    return readoutRows(state.complexNumbers.map((number) => [number.label, formatComplex(number.value)]));
  }

  if (kind === "complex-arithmetic") {
    const [first, second] = firstTwoComplex(state);
    if (!first || !second) {
      return readoutRows([["complex", "n/a"]]);
    }
    return readoutRows([
      [`${first.label}+${second.label}`, formatComplex(addComplex(first.value, second.value))],
      [`${first.label}${second.label}`, formatComplex(multiplyComplex(first.value, second.value))],
    ]);
  }

  if (kind === "complex-polar") {
    const number = getSelectedComplexNumber(state);
    if (!number) {
      return readoutRows([["polar", "n/a"]]);
    }
    return readoutRows([
      [number.label, formatComplex(number.value)],
      ["|z|", formatNumber(modulus(number.value))],
      ["theta", `${formatNumber(radiansToDegrees(argument(number.value)))} deg`],
    ]);
  }

  if (kind === "matrix") {
    const vector = getSelectedVector(state);
    const rows: Array<[string, string]> = [
      ["M", formatMatrix(state.transformMatrix)],
      ["det(M)", formatNumber(det2(state.transformMatrix))],
    ];
    if (vector) {
      rows.push(["Mv", formatVec(applyMat2(state.transformMatrix, vector.value))]);
    }
    return readoutRows(rows);
  }

  if (kind === "determinant") {
    const [first, second] = firstTwoVectors(state);
    if (!first || !second) {
      return readoutRows([["det", "n/a"]]);
    }
    const matrix = mat2FromColumns(first.value, second.value);
    return readoutRows([
      ["A", formatMatrix(matrix)],
      ["det(A)", formatNumber(det2(matrix))],
      ["area", formatNumber(Math.abs(det2(matrix)))],
    ]);
  }

  if (kind === "matrix-product") {
    return readoutRows([
      ["current", formatMatrix(state.transformMatrix)],
      ["det", formatNumber(det2(state.transformMatrix))],
    ]);
  }

  return readoutRows([["readout", "n/a"]]);
}

function readoutRows(rows: Array<[string, string]>): string {
  return `<dl>${rows
    .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("")}</dl>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function firstTwoVectors(appState: AppState): [VectorItem | null, VectorItem | null] {
  return [appState.vectors[0] ?? null, appState.vectors[1] ?? null];
}

function firstTwoComplex(appState: AppState): [ComplexItem | null, ComplexItem | null] {
  return [appState.complexNumbers[0] ?? null, appState.complexNumbers[1] ?? null];
}

function formatVec(value: Vec2): string {
  return `(${formatNumber(value.x)}, ${formatNumber(value.y)})`;
}

function formatComplex(value: Vec2): string {
  const real = formatNumber(value.x);
  const imag = formatNumber(Math.abs(value.y));
  const sign = value.y < 0 ? "-" : "+";
  return `${real} ${sign} ${imag}i`;
}

function formatMatrix(matrix: Mat2): string {
  return `[${formatNumber(matrix[0][0])}, ${formatNumber(matrix[0][1])}; ${formatNumber(
    matrix[1][0],
  )}, ${formatNumber(matrix[1][1])}]`;
}

function formatNumber(value: number): string {
  if (Math.abs(value) < 1e-10) {
    return "0";
  }
  return Number(value.toFixed(3)).toString();
}
