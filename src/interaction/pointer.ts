import type { AppState, Camera, Vec2 } from "../app/types";
import { setSelectedComplexNumber, setSelectedVector } from "../app/state";
import { makeCameraFromState } from "../render/camera";
import { hitTestComplexNumber, updateDraggedComplexNumber } from "./dragComplex";
import { hitTestVector, updateDraggedVector } from "./dragVectors";

type DragMode =
  | { type: "none" }
  | { type: "pan"; previous: Vec2 }
  | { type: "vector"; vectorId: string }
  | { type: "complex"; numberId: string };

export function bindPointerInteractions(
  canvas: HTMLCanvasElement,
  state: AppState,
  redraw: () => void,
  syncControls: () => void,
): void {
  let dragMode: DragMode = { type: "none" };

  canvas.addEventListener("pointerdown", (event) => {
    const screenPoint = pointerPosition(canvas, event);
    const camera = cameraForCanvas(canvas, state);

    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");

    if (state.mode === "complex") {
      const numberId = hitTestComplexNumber(screenPoint, state, camera);
      if (numberId) {
        setSelectedComplexNumber(state, numberId);
        syncControls();
        redraw();
        dragMode = { type: "complex", numberId };
        return;
      }

      dragMode = { type: "pan", previous: screenPoint };
      return;
    }

    const vectorId = hitTestVector(screenPoint, state, camera);
    if (vectorId) {
      setSelectedVector(state, vectorId);
      syncControls();
      redraw();
      dragMode = { type: "vector", vectorId };
      return;
    }

    dragMode = { type: "pan", previous: screenPoint };
  });

  canvas.addEventListener("pointermove", (event) => {
    if (dragMode.type === "none") {
      return;
    }

    const screenPoint = pointerPosition(canvas, event);
    const camera = cameraForCanvas(canvas, state);

    if (dragMode.type === "vector") {
      updateDraggedVector(state, dragMode.vectorId, screenPoint, camera);
      syncControls();
      redraw();
      return;
    }

    if (dragMode.type === "complex") {
      updateDraggedComplexNumber(state, dragMode.numberId, screenPoint, camera);
      syncControls();
      redraw();
      return;
    }

    const dx = screenPoint.x - dragMode.previous.x;
    const dy = screenPoint.y - dragMode.previous.y;
    state.pan = {
      x: state.pan.x - dx / camera.scale,
      y: state.pan.y + dy / camera.scale,
    };
    dragMode = { type: "pan", previous: screenPoint };
    redraw();
  });

  canvas.addEventListener("pointerup", (event) => {
    endDrag(canvas, event.pointerId);
    dragMode = { type: "none" };
  });

  canvas.addEventListener("pointercancel", (event) => {
    endDrag(canvas, event.pointerId);
    dragMode = { type: "none" };
  });

  window.addEventListener("resize", redraw);
}

function cameraForCanvas(canvas: HTMLCanvasElement, state: AppState): Camera {
  const rect = canvas.getBoundingClientRect();
  return makeCameraFromState(state, rect.width, rect.height);
}

function pointerPosition(canvas: HTMLCanvasElement, event: PointerEvent): Vec2 {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function endDrag(canvas: HTMLCanvasElement, pointerId: number): void {
  if (canvas.hasPointerCapture(pointerId)) {
    canvas.releasePointerCapture(pointerId);
  }
  canvas.classList.remove("dragging");
}
