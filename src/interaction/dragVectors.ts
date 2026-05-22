import { setSelectedVector, updateVectorValue } from "../app/state";
import type { AppState, Camera, Vec2 } from "../app/types";
import { distance } from "../math/vec2";
import { screenToWorld, worldToScreen } from "../render/camera";

export function hitTestVector(
  screenPoint: Vec2,
  state: AppState,
  camera: Camera,
): string | null {
  for (let index = state.vectors.length - 1; index >= 0; index -= 1) {
    const vector = state.vectors[index];
    if (distance(screenPoint, worldToScreen(camera, vector.value)) <= 13) {
      return vector.id;
    }
  }

  const origin = worldToScreen(camera, { x: 0, y: 0 });
  for (let index = state.vectors.length - 1; index >= 0; index -= 1) {
    const vector = state.vectors[index];
    const endpoint = worldToScreen(camera, vector.value);
    if (distanceToSegment(screenPoint, origin, endpoint) <= 8) {
      return vector.id;
    }
  }

  return null;
}

export function updateDraggedVector(
  state: AppState,
  vectorId: string,
  screenPoint: Vec2,
  camera: Camera,
): void {
  updateVectorValue(state, vectorId, screenToWorld(camera, screenPoint));
  setSelectedVector(state, vectorId);
}

function distanceToSegment(point: Vec2, start: Vec2, end: Vec2): number {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const lengthSquared = segmentX ** 2 + segmentY ** 2;

  if (lengthSquared < 1e-9) {
    return distance(point, end);
  }

  const rawT = ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / lengthSquared;
  if (rawT < 0.12 || rawT > 1) {
    return Number.POSITIVE_INFINITY;
  }

  const t = Math.min(1, rawT);
  return distance(point, {
    x: start.x + segmentX * t,
    y: start.y + segmentY * t,
  });
}
