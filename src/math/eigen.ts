import type { Mat2, Vec2 } from "../app/types";
import { norm, scale } from "./vec2";

const EPSILON = 1e-9;

export type RealEigenKind = "two-real" | "one-real-line" | "every-direction" | "none-real";

export type RealEigenpair = {
  value: number;
  vector: Vec2;
};

export type RealEigenResult = {
  kind: RealEigenKind;
  discriminant: number;
  eigenvalues: number[];
  eigenpairs: RealEigenpair[];
};

export function realEigenpairs2(matrix: Mat2): RealEigenResult {
  const a = matrix[0][0];
  const b = matrix[0][1];
  const c = matrix[1][0];
  const d = matrix[1][1];
  const trace = a + d;
  const determinant = a * d - b * c;
  const discriminant = trace * trace - 4 * determinant;

  if (discriminant < -EPSILON) {
    return { kind: "none-real", discriminant, eigenvalues: [], eigenpairs: [] };
  }

  if (Math.abs(discriminant) <= EPSILON) {
    const value = trace / 2;
    if (isScalarMatrix(matrix, value)) {
      return { kind: "every-direction", discriminant, eigenvalues: [value], eigenpairs: [] };
    }

    const vector = eigenvectorForValue(matrix, value);
    return {
      kind: "one-real-line",
      discriminant,
      eigenvalues: [value],
      eigenpairs: vector ? [{ value, vector }] : [],
    };
  }

  const root = Math.sqrt(discriminant);
  const values = [(trace + root) / 2, (trace - root) / 2];
  const eigenpairs = values.flatMap((value) => {
    const vector = eigenvectorForValue(matrix, value);
    return vector ? [{ value, vector }] : [];
  });

  return { kind: "two-real", discriminant, eigenvalues: values, eigenpairs };
}

function eigenvectorForValue(matrix: Mat2, value: number): Vec2 | null {
  const row1: Vec2 = { x: matrix[0][0] - value, y: matrix[0][1] };
  const row2: Vec2 = { x: matrix[1][0], y: matrix[1][1] - value };
  const row = norm(row1) > norm(row2) ? row1 : row2;

  if (norm(row) < EPSILON) {
    return { x: 1, y: 0 };
  }

  const vector = normalize({ x: -row.y, y: row.x });
  return vector ? canonicalDirection(vector) : null;
}

function isScalarMatrix(matrix: Mat2, value: number): boolean {
  return (
    Math.abs(matrix[0][0] - value) < EPSILON &&
    Math.abs(matrix[1][1] - value) < EPSILON &&
    Math.abs(matrix[0][1]) < EPSILON &&
    Math.abs(matrix[1][0]) < EPSILON
  );
}

function normalize(vector: Vec2): Vec2 | null {
  const length = norm(vector);
  if (length < EPSILON) {
    return null;
  }
  return scale(vector, 1 / length);
}

function canonicalDirection(vector: Vec2): Vec2 {
  if (vector.x < -EPSILON || (Math.abs(vector.x) <= EPSILON && vector.y < 0)) {
    return scale(vector, -1);
  }
  return vector;
}
