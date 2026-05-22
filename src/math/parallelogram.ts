import type { Vec2 } from "../app/types";
import { add } from "./vec2";

export function parallelogramFromVectors(first: Vec2, second: Vec2): Vec2[] {
  const origin = { x: 0, y: 0 };
  return [origin, first, add(first, second), second];
}
