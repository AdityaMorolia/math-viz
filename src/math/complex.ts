import type { Vec2 } from "../app/types";
import { add as addVec2 } from "./vec2";

export function addComplex(a: Vec2, b: Vec2): Vec2 {
  return addVec2(a, b);
}

export function multiplyComplex(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x * b.x - a.y * b.y,
    y: a.x * b.y + a.y * b.x,
  };
}

export function conjugateComplex(value: Vec2): Vec2 {
  return { x: value.x, y: -value.y };
}

export function rotateByAngle(value: Vec2, theta: number): Vec2 {
  return multiplyComplex(value, { x: Math.cos(theta), y: Math.sin(theta) });
}

export function modulus(value: Vec2): number {
  return Math.hypot(value.x, value.y);
}

export function argument(value: Vec2): number {
  return Math.atan2(value.y, value.x);
}

export function radiansToDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

export function normalizeAngle(value: number): number {
  let angle = value;
  while (angle <= -Math.PI) {
    angle += Math.PI * 2;
  }
  while (angle > Math.PI) {
    angle -= Math.PI * 2;
  }
  return angle;
}
