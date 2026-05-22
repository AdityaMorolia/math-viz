import type { Mat2, Vec2 } from "../app/types";

export function applyMat2(matrix: Mat2, v: Vec2): Vec2 {
  return {
    x: matrix[0][0] * v.x + matrix[0][1] * v.y,
    y: matrix[1][0] * v.x + matrix[1][1] * v.y,
  };
}

export function det2(matrix: Mat2): number {
  return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

export function inverse2(matrix: Mat2): Mat2 | null {
  const det = det2(matrix);
  if (Math.abs(det) < 1e-10) {
    return null;
  }

  return [
    [matrix[1][1] / det, -matrix[0][1] / det],
    [-matrix[1][0] / det, matrix[0][0] / det],
  ];
}

export function transpose2(matrix: Mat2): Mat2 {
  return [
    [matrix[0][0], matrix[1][0]],
    [matrix[0][1], matrix[1][1]],
  ];
}

export function mulMat2(a: Mat2, b: Mat2): Mat2 {
  return [
    [
      a[0][0] * b[0][0] + a[0][1] * b[1][0],
      a[0][0] * b[0][1] + a[0][1] * b[1][1],
    ],
    [
      a[1][0] * b[0][0] + a[1][1] * b[1][0],
      a[1][0] * b[0][1] + a[1][1] * b[1][1],
    ],
  ];
}

export function mat2FromColumns(first: Vec2, second: Vec2): Mat2 {
  return [
    [first.x, second.x],
    [first.y, second.y],
  ];
}
