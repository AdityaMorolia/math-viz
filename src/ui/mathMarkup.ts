import type { Mat2, Vec2 } from "../app/types";

export type ReadoutMarkup = {
  html: string;
};

export function vectorMarkup(vector: Vec2): ReadoutMarkup {
  return {
    html: mathArray([[formatMathNumber(vector.x)], [formatMathNumber(vector.y)]], "(", ")"),
  };
}

export function matrixMarkup(matrix: Mat2): ReadoutMarkup {
  return {
    html: mathArray(
      [
        [formatMathNumber(matrix[0][0]), formatMathNumber(matrix[0][1])],
        [formatMathNumber(matrix[1][0]), formatMathNumber(matrix[1][1])],
      ],
      "[",
      "]",
    ),
  };
}

export function formatMathNumber(value: number): string {
  if (Math.abs(value) < 1e-10) {
    return "0";
  }
  return Number(value.toFixed(3)).toString();
}

function mathArray(rows: string[][], leftBracket: string, rightBracket: string): string {
  const columnCount = rows[0]?.length ?? 1;
  const entries = rows
    .flat()
    .map((entry) => `<span class="readout-math-entry">${entry}</span>`)
    .join("");

  return `<span class="readout-math-array" aria-label="${escapeHtml(
    rows.map((row) => row.join(", ")).join("; "),
  )}"><span class="readout-math-bracket">${escapeHtml(leftBracket)}</span><span class="readout-math-grid readout-math-cols-${columnCount}">${entries}</span><span class="readout-math-bracket">${escapeHtml(rightBracket)}</span></span>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
