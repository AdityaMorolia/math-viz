import type { AppState, Bounds, Camera, Vec2 } from "../app/types";

export const BASE_SCALE = 200;

export function makeCameraFromState(state: AppState, width: number, height: number): Camera {
  return {
    width,
    height,
    scale: BASE_SCALE / 2 ** state.zoomOut,
    center: state.pan,
  };
}

export function worldToScreen(camera: Camera, point: Vec2): Vec2 {
  return {
    x: (point.x - camera.center.x) * camera.scale + camera.width / 2,
    y: camera.height / 2 - (point.y - camera.center.y) * camera.scale,
  };
}

export function screenToWorld(camera: Camera, point: Vec2): Vec2 {
  return {
    x: (point.x - camera.width / 2) / camera.scale + camera.center.x,
    y: (camera.height / 2 - point.y) / camera.scale + camera.center.y,
  };
}

export function getVisibleWorldBounds(camera: Camera, paddingPx = 80): Bounds {
  const min = screenToWorld(camera, { x: -paddingPx, y: camera.height + paddingPx });
  const max = screenToWorld(camera, { x: camera.width + paddingPx, y: -paddingPx });
  return {
    minX: min.x,
    maxX: max.x,
    minY: min.y,
    maxY: max.y,
  };
}
