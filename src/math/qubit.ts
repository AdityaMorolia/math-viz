import type { QubitGate, QubitPreset, QubitRotationAngles, Vec2 } from "../app/types";
import { addComplex, conjugateComplex, modulus, multiplyComplex, rotateByAngle } from "./complex";
import { scale } from "./vec2";

export type QubitAmplitudes = {
  alpha: Vec2;
  beta: Vec2;
};

export type QubitProbabilities = {
  zero: number;
  one: number;
};

export type BlochCoordinates = {
  x: number;
  y: number;
  z: number;
};

const INV_SQRT_2 = 1 / Math.sqrt(2);
const ZERO: Vec2 = { x: 0, y: 0 };
const ONE: Vec2 = { x: 1, y: 0 };

export function normalizeQubit(alpha: Vec2, beta: Vec2): QubitAmplitudes {
  const length = Math.hypot(modulus(alpha), modulus(beta));
  if (length < 1e-10) {
    return { alpha: ONE, beta: ZERO };
  }

  return {
    alpha: scale(alpha, 1 / length),
    beta: scale(beta, 1 / length),
  };
}

export function qubitProbabilities(alpha: Vec2, beta: Vec2): QubitProbabilities {
  return {
    zero: modulus(alpha) ** 2,
    one: modulus(beta) ** 2,
  };
}

export function blochCoordinates(alpha: Vec2, beta: Vec2): BlochCoordinates {
  const cross = multiplyComplex(conjugateComplex(alpha), beta);
  const probabilities = qubitProbabilities(alpha, beta);
  return {
    x: 2 * cross.x,
    y: 2 * cross.y,
    z: probabilities.zero - probabilities.one,
  };
}

export function applyQubitGateToAmplitudes(
  alpha: Vec2,
  beta: Vec2,
  gate: QubitGate,
): QubitAmplitudes {
  if (gate === "X") {
    return normalizeQubit(beta, alpha);
  }

  if (gate === "Y") {
    return normalizeQubit(
      multiplyComplex(beta, { x: 0, y: -1 }),
      multiplyComplex(alpha, { x: 0, y: 1 }),
    );
  }

  if (gate === "Z") {
    return normalizeQubit(alpha, scale(beta, -1));
  }

  if (gate === "H") {
    return normalizeQubit(
      scale(addComplex(alpha, beta), INV_SQRT_2),
      scale(addComplex(alpha, scale(beta, -1)), INV_SQRT_2),
    );
  }

  if (gate === "S") {
    return normalizeQubit(alpha, rotateByAngle(beta, Math.PI / 2));
  }

  return normalizeQubit(alpha, rotateByAngle(beta, Math.PI / 4));
}

export function rotateQubitAmplitudes(
  alpha: Vec2,
  beta: Vec2,
  axis: keyof QubitRotationAngles,
  theta: number,
): QubitAmplitudes {
  const c = Math.cos(theta / 2);
  const s = Math.sin(theta / 2);

  if (axis === "x") {
    return normalizeQubit(
      addComplex(scale(alpha, c), multiplyComplex(beta, { x: 0, y: -s })),
      addComplex(multiplyComplex(alpha, { x: 0, y: -s }), scale(beta, c)),
    );
  }

  if (axis === "y") {
    return normalizeQubit(
      addComplex(scale(alpha, c), scale(beta, -s)),
      addComplex(scale(alpha, s), scale(beta, c)),
    );
  }

  return normalizeQubit(
    rotateByAngle(alpha, -theta / 2),
    rotateByAngle(beta, theta / 2),
  );
}

export function qubitPresetAmplitudes(preset: QubitPreset): QubitAmplitudes {
  if (preset === "one") {
    return { alpha: ZERO, beta: ONE };
  }

  if (preset === "plus") {
    return { alpha: { x: INV_SQRT_2, y: 0 }, beta: { x: INV_SQRT_2, y: 0 } };
  }

  if (preset === "minus") {
    return { alpha: { x: INV_SQRT_2, y: 0 }, beta: { x: -INV_SQRT_2, y: 0 } };
  }

  if (preset === "i-plus") {
    return { alpha: { x: INV_SQRT_2, y: 0 }, beta: { x: 0, y: INV_SQRT_2 } };
  }

  if (preset === "i-minus") {
    return { alpha: { x: INV_SQRT_2, y: 0 }, beta: { x: 0, y: -INV_SQRT_2 } };
  }

  return { alpha: ONE, beta: ZERO };
}
