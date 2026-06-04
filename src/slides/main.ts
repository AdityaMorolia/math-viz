import "../style.css";
import "./style.css";
import {
  createInitialState,
  getSelectedComplexNumber,
  setComplexRotationTheta,
  setMode,
  setScalarMultiplier,
  setScalarVector,
  setTransformMatrix,
  setTransformT,
  setZoomOut,
  updateComplexValue,
  updateVectorValue,
} from "../app/state";
import type { ComplexItem, Mat2, PairSelection, Vec2, VectorItem } from "../app/types";
import { bindPointerInteractions } from "../interaction/pointer";
import { argument, radiansToDegrees } from "../math/complex";
import { scale } from "../math/vec2";
import { createRenderer } from "../render/renderer";
import { SLIDES } from "./deck";
import type {
  ControlSpec,
  MatrixPresetSpec,
  ReadoutKind,
  SceneFitSpec,
  ScenePreset,
  SlideSpec,
  VisualSpec,
} from "./deck";
import { renderReadout } from "./readouts";
import { fitCanvasToScene } from "./sceneFit";

type SyncCallback = () => void;

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: Element[]) => Promise<void>;
    };
  }
}

const root = mustGetElement<HTMLElement>("slide-root");
const PAUSE_MARKER = "deck-pause";
const detachedViz = document.createElement("div");
detachedViz.className = "detached-viz";
document.body.append(detachedViz);

const vizHost = document.createElement("div");
vizHost.className = "slide-viz-host";

const canvas = document.createElement("canvas");
canvas.className = "slide-canvas";
canvas.setAttribute("aria-label", "Math visualization");
vizHost.append(canvas);
detachedViz.append(vizHost);

const state = createInitialState();
const renderer = createRenderer(canvas, state);

let activeIndex = indexFromHash();
let activeReadoutKind: ReadoutKind | null = null;
let activeReadoutElement: HTMLElement | null = null;
let activeControlsElement: HTMLElement | null = null;
let activeSyncCallbacks: SyncCallback[] = [];
let activeHasCanvas = false;
let activeFitSpec: SceneFitSpec | false | null = null;
let activeVizSlot: HTMLElement | null = null;
let fitFrame = 0;
let userAdjustedCamera = false;

const fitObserver = new ResizeObserver(() => {
  scheduleFitAndRedraw();
});

const redrawAndSync = (options: { fit?: boolean } = {}): void => {
  syncFromState();
  if (activeHasCanvas) {
    if (options.fit) {
      fitCanvasToActiveScene();
    }
    renderer.redraw();
  }
};

const syncFromState = (): void => {
  for (const sync of activeSyncCallbacks) {
    sync();
  }
  renderActiveReadout();
};

bindPointerInteractions(canvas, state, renderer.redraw, syncFromState, () => {
  userAdjustedCamera = true;
});
renderActiveSlide();

window.addEventListener("hashchange", () => {
  const nextIndex = indexFromHash();
  if (nextIndex !== activeIndex) {
    activeIndex = nextIndex;
    renderActiveSlide();
  }
});

window.addEventListener("keydown", (event) => {
  if (isEditingTarget(event.target)) {
    return;
  }

  if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    goToSlide(activeIndex + 1);
    return;
  }

  if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    goToSlide(activeIndex - 1);
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    goToSlide(0);
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    goToSlide(SLIDES.length - 1);
  }
});

function renderActiveSlide(): void {
  const slide = SLIDES[activeIndex];
  fitObserver.disconnect();
  cancelAnimationFrame(fitFrame);
  activeHasCanvas = false;
  activeFitSpec = null;
  activeVizSlot = null;
  userAdjustedCamera = false;
  activeReadoutKind = null;
  activeReadoutElement = null;
  activeControlsElement = null;
  activeSyncCallbacks = [];
  detachedViz.append(vizHost);

  const shell = document.createElement("div");
  shell.className = "slide-shell";

  const progress = document.createElement("div");
  progress.className = "slide-progress";
  progress.append(createProgressBar());

  const article = document.createElement("article");
  article.className = `slide slide-${slide.layout ?? "split"} ${slide.visual ? "" : "slide-no-visual"}`;

  const text = document.createElement("section");
  text.className = "slide-text";
  text.append(createTitleBlock(slide));

  const body = document.createElement("div");
  body.className = "slide-body";
  body.innerHTML = slide.body;
  applyPauseVisibility(body, slide.pauseStep);
  text.append(body);

  if (slide.visual) {
    const visual = createVisual(slide.visual);
    if (activeControlsElement) {
      text.append(activeControlsElement);
    }
    article.append(text, visual);
  } else {
    article.append(text);
  }

  shell.append(progress, article, createNavigation());
  root.replaceChildren(shell);

  if (slide.visual?.kind === "canvas") {
    if (activeVizSlot) {
      fitObserver.observe(activeVizSlot);
    }
    fitObserver.observe(shell);
    scheduleFitAndRedraw();
  }
  void typesetMath(shell).then(() => {
    scheduleFitAndRedraw();
  });
}

function createTitleBlock(slide: SlideSpec): HTMLElement {
  const header = document.createElement("header");
  header.className = "slide-header";

  const title = document.createElement("h1");
  title.textContent = slide.title;
  header.append(title);

  if (slide.subtitle) {
    const subtitle = document.createElement("p");
    subtitle.className = "slide-subtitle";
    subtitle.textContent = slide.subtitle;
    header.append(subtitle);
  }

  return header;
}

function createVisual(visual: VisualSpec): HTMLElement {
  const visualRoot = document.createElement("section");
  visualRoot.className = "slide-visual";

  applyScenePreset(visual.scene);
  activeHasCanvas = true;
  activeFitSpec = visual.fit ?? {};

  const slot = document.createElement("div");
  slot.className = "viz-slot";
  slot.append(vizHost);
  activeVizSlot = slot;
  visualRoot.append(slot);

  if (visual.controls?.length || visual.readout) {
    const panel = document.createElement("aside");
    panel.className = "mini-panel";

    if (visual.controls?.length) {
      for (const control of visual.controls) {
        panel.append(createControl(control));
      }
    }

    if (visual.readout) {
      activeReadoutKind = visual.readout;
      activeReadoutElement = document.createElement("div");
      activeReadoutElement.className = "readout-card";
      panel.append(activeReadoutElement);
    }

    activeControlsElement = panel;
  }

  return visualRoot;
}

function applyPauseVisibility(rootElement: HTMLElement, pauseStep: number | undefined): void {
  if (pauseStep === undefined) {
    return;
  }

  let currentPauseStep = 0;
  applyPauseVisibilityToChildren(rootElement, () => currentPauseStep, (nextPauseStep) => {
    currentPauseStep = nextPauseStep;
  }, pauseStep);
}

function applyPauseVisibilityToChildren(
  parent: Node,
  getCurrentPauseStep: () => number,
  setCurrentPauseStep: (pauseStep: number) => void,
  activePauseStep: number,
): void {
  for (const node of Array.from(parent.childNodes)) {
    const currentPauseStep = getCurrentPauseStep();
    if (isPauseMarker(node)) {
      setCurrentPauseStep(currentPauseStep + 1);
      continue;
    }

    if (currentPauseStep > activePauseStep) {
      hidePauseNode(node);
      continue;
    }

    if (node instanceof Element) {
      applyPauseVisibilityToChildren(node, getCurrentPauseStep, setCurrentPauseStep, activePauseStep);
    }
  }
}

function hidePauseNode(node: Node): void {
  if (node instanceof Element) {
    node.classList.add("pause-hidden");
    node.setAttribute("aria-hidden", "true");
    return;
  }

  if (node.nodeType === Node.TEXT_NODE && node.textContent) {
    const hidden = document.createElement("span");
    hidden.className = "pause-hidden";
    hidden.setAttribute("aria-hidden", "true");
    hidden.textContent = node.textContent;
    node.replaceWith(hidden);
  }
}

function isPauseMarker(node: Node): boolean {
  return node.nodeType === Node.COMMENT_NODE && node.textContent?.trim() === PAUSE_MARKER;
}

function createNavigation(): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = "slide-nav";

  const previous = document.createElement("button");
  previous.type = "button";
  previous.textContent = "Previous";
  previous.disabled = activeIndex === 0;
  previous.addEventListener("click", () => goToSlide(activeIndex - 1));

  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Reset slide";
  reset.addEventListener("click", renderActiveSlide);

  const counter = document.createElement("div");
  counter.className = "slide-counter";
  counter.textContent = `${activeIndex + 1} / ${SLIDES.length}`;

  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "Next";
  next.disabled = activeIndex === SLIDES.length - 1;
  next.addEventListener("click", () => goToSlide(activeIndex + 1));

  nav.append(previous, reset, counter, next);
  return nav;
}

function createProgressBar(): HTMLElement {
  const bar = document.createElement("div");
  bar.className = "slide-progress-bar";
  bar.style.width = `${((activeIndex + 1) / SLIDES.length) * 100}%`;
  return bar;
}

function createControl(control: ControlSpec): HTMLElement {
  if (control.kind === "scalar") {
    return createScalarControl(control);
  }

  if (control.kind === "linear-combo") {
    return createLinearComboControl(control);
  }

  if (control.kind === "matrix-presets") {
    return createMatrixPresetControl(control.presets);
  }

  if (control.kind === "transform") {
    return createTransformControl(control.label);
  }

  if (control.kind === "complex-angle") {
    return createComplexAngleControl(control);
  }

  if (control.kind === "complex-i-powers") {
    return createComplexIPowersControl(control.multiplierId);
  }

  return assertNever(control);
}

function createScalarControl(control: Extract<ControlSpec, { kind: "scalar" }>): HTMLElement {
  const section = createControlSection(control.label);
  const value = document.createElement("span");
  value.className = "control-value";

  const input = document.createElement("input");
  input.type = "range";
  input.min = control.min.toString();
  input.max = control.max.toString();
  input.step = control.step.toString();
  input.value = state.scalarMultiplier.toString();

  input.addEventListener("input", () => {
    setScalarMultiplier(state, Number(input.value));
    redrawAndSync({ fit: true });
  });

  section.append(value, input);
  activeSyncCallbacks.push(() => {
    input.value = state.scalarMultiplier.toString();
    value.textContent = formatNumber(state.scalarMultiplier);
  });

  return section;
}

function createLinearComboControl(
  control: Extract<ControlSpec, { kind: "linear-combo" }>,
): HTMLElement {
  const section = createControlSection("Linear combination");
  const first = createLabeledRange("c0", control.firstInitial, -3, 3, 0.05);
  const second = createLabeledRange("c1", control.secondInitial, -3, 3, 0.05);

  const updateVectors = (): void => {
    const c0 = Number(first.input.value);
    const c1 = Number(second.input.value);
    updateVectorValue(state, control.firstId, scale(control.firstBase, c0));
    updateVectorValue(state, control.secondId, scale(control.secondBase, c1));
    first.value.textContent = formatNumber(c0);
    second.value.textContent = formatNumber(c1);
  };

  first.input.addEventListener("input", () => {
    updateVectors();
    redrawAndSync({ fit: true });
  });
  second.input.addEventListener("input", () => {
    updateVectors();
    redrawAndSync({ fit: true });
  });

  section.append(first.row, second.row);
  updateVectors();
  activeSyncCallbacks.push(() => {
    first.value.textContent = formatNumber(Number(first.input.value));
    second.value.textContent = formatNumber(Number(second.input.value));
  });

  return section;
}

function createMatrixPresetControl(presets: MatrixPresetSpec[]): HTMLElement {
  const section = createControlSection("Matrix presets");
  const buttons = document.createElement("div");
  buttons.className = "button-grid";

  const presetButtons: Array<{ preset: MatrixPresetSpec; button: HTMLButtonElement }> = [];
  for (const preset of presets) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = preset.label;
    button.addEventListener("click", () => {
      setTransformMatrix(state, preset.matrix);
      setTransformT(state, preset.transformT ?? 1);
      redrawAndSync({ fit: true });
    });
    presetButtons.push({ preset, button });
    buttons.append(button);
  }

  section.append(buttons);
  activeSyncCallbacks.push(() => {
    for (const { preset, button } of presetButtons) {
      button.classList.toggle("active", matricesEqual(state.transformMatrix, preset.matrix));
    }
  });

  return section;
}

function createTransformControl(label: string): HTMLElement {
  const section = createControlSection(label);
  const value = document.createElement("span");
  value.className = "control-value";

  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "1";
  input.step = "0.01";
  input.value = state.transformT.toString();
  input.addEventListener("input", () => {
    setTransformT(state, Number(input.value));
    redrawAndSync({ fit: true });
  });

  section.append(value, input);
  activeSyncCallbacks.push(() => {
    input.value = state.transformT.toString();
    value.textContent = `${formatNumber(state.transformT * 100)}%`;
  });

  return section;
}

function createComplexAngleControl(
  control: Extract<ControlSpec, { kind: "complex-angle" }>,
): HTMLElement {
  const section = createControlSection(control.label);
  const value = document.createElement("span");
  value.className = "control-value";

  const input = document.createElement("input");
  input.type = "range";
  input.min = "-3.14159";
  input.max = "3.14159";
  input.step = "0.01";
  input.value = control.initialTheta.toString();

  const updateAngle = (): void => {
    const theta = Number(input.value);
    updateComplexValue(state, control.targetId, { x: Math.cos(theta), y: Math.sin(theta) });
    setComplexRotationTheta(state, theta);
    value.textContent = `${formatNumber(radiansToDegrees(theta))} deg`;
  };

  input.addEventListener("input", () => {
    updateAngle();
    redrawAndSync({ fit: true });
  });

  section.append(value, input);
  updateAngle();
  activeSyncCallbacks.push(() => {
    const selected = getSelectedComplexNumber(state);
    if (selected?.id === control.targetId) {
      input.value = argument(selected.value).toString();
    }
    value.textContent = `${formatNumber(radiansToDegrees(Number(input.value)))} deg`;
  });

  return section;
}

function createComplexIPowersControl(multiplierId: string): HTMLElement {
  const section = createControlSection("Multiply by");
  const buttons = document.createElement("div");
  buttons.className = "button-grid four-up";
  const powers = [
    { label: "i", value: { x: 0, y: 1 } },
    { label: "i^2", value: { x: -1, y: 0 } },
    { label: "i^3", value: { x: 0, y: -1 } },
    { label: "i^4", value: { x: 1, y: 0 } },
  ];

  const buttonRefs: Array<{ value: Vec2; button: HTMLButtonElement }> = [];
  for (const power of powers) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = power.label;
    button.addEventListener("click", () => {
      updateComplexValue(state, multiplierId, power.value);
      const item = state.complexNumbers.find((number) => number.id === multiplierId);
      if (item) {
        item.label = power.label;
      }
      redrawAndSync({ fit: true });
    });
    buttonRefs.push({ value: power.value, button });
    buttons.append(button);
  }

  section.append(buttons);
  activeSyncCallbacks.push(() => {
    const item = state.complexNumbers.find((number) => number.id === multiplierId);
    for (const ref of buttonRefs) {
      ref.button.classList.toggle("active", !!item && vectorsEqual(item.value, ref.value));
    }
  });

  return section;
}

function createControlSection(title: string): HTMLElement {
  const section = document.createElement("section");
  section.className = "control-section";

  const heading = document.createElement("div");
  heading.className = "control-title";
  heading.textContent = title;
  section.append(heading);

  return section;
}

function createLabeledRange(
  label: string,
  initial: number,
  min: number,
  max: number,
  step: number,
): { row: HTMLElement; input: HTMLInputElement; value: HTMLElement } {
  const row = document.createElement("label");
  row.className = "range-row";

  const name = document.createElement("span");
  name.textContent = label;

  const value = document.createElement("span");
  value.className = "control-value";
  value.textContent = formatNumber(initial);

  const input = document.createElement("input");
  input.type = "range";
  input.min = min.toString();
  input.max = max.toString();
  input.step = step.toString();
  input.value = initial.toString();

  row.append(name, value, input);
  return { row, input, value };
}

function applyScenePreset(scene: ScenePreset): void {
  const fresh = createInitialState();
  Object.assign(state, fresh);

  state.vectors = cloneVectors(scene.vectors ?? fresh.vectors);
  state.complexNumbers = cloneComplexItems(scene.complexNumbers ?? fresh.complexNumbers);
  state.selectedVectorId = scene.selectedVectorId ?? state.vectors[0]?.id ?? null;
  state.selectedComplexId = scene.selectedComplexId ?? state.complexNumbers[0]?.id ?? null;
  state.pairSelection = clonePair(scene.pairSelection ?? fresh.pairSelection);
  state.complexAdditionSelection = clonePair(scene.complexAdditionSelection ?? fresh.complexAdditionSelection);
  state.complexMultiplicationSelection = clonePair(
    scene.complexMultiplicationSelection ?? fresh.complexMultiplicationSelection,
  );
  state.complexUnaryId = scene.complexUnaryId ?? state.complexNumbers[0]?.id ?? null;
  state.complexConcepts = {
    ...fresh.complexConcepts,
    ...scene.complexConcepts,
  };
  state.showComponentLegs = scene.showComponentLegs ?? fresh.showComponentLegs;
  state.showAxisCoordinates = scene.showAxisCoordinates ?? fresh.showAxisCoordinates;
  state.pan = cloneVec2(scene.pan ?? fresh.pan);
  state.nextVectorNumber = state.vectors.length + 1;
  state.nextComplexNumber = state.complexNumbers.length + 1;

  setMode(state, scene.mode);
  setZoomOut(state, scene.zoomOut ?? fresh.zoomOut);
  if (scene.transformMatrix) {
    setTransformMatrix(state, scene.transformMatrix);
  }
  setTransformT(state, scene.transformT ?? fresh.transformT);
  setScalarMultiplier(state, scene.scalarMultiplier ?? fresh.scalarMultiplier);
  setScalarVector(state, scene.scalarVectorId ?? fresh.scalarVectorId);
  setComplexRotationTheta(state, scene.complexRotationTheta ?? fresh.complexRotationTheta);
}

function scheduleFitAndRedraw(): void {
  if (!activeHasCanvas) {
    return;
  }

  cancelAnimationFrame(fitFrame);
  fitFrame = requestAnimationFrame(() => {
    fitFrame = 0;
    fitCanvasToActiveScene(true);
    syncFromState();
    renderer.redraw();
  });
}

function fitCanvasToActiveScene(force = false): void {
  if (!activeHasCanvas || activeFitSpec === false) {
    return;
  }

  if (userAdjustedCamera && !force) {
    return;
  }

  fitCanvasToScene(canvas, state, activeFitSpec ?? {});
}

function renderActiveReadout(): void {
  if (!activeReadoutElement || !activeReadoutKind) {
    return;
  }

  activeReadoutElement.innerHTML = renderReadout(state, activeReadoutKind);
}

function goToSlide(index: number): void {
  const nextIndex = clamp(index, 0, SLIDES.length - 1);
  if (nextIndex === activeIndex) {
    return;
  }
  activeIndex = nextIndex;
  window.location.hash = `slide-${activeIndex + 1}`;
  renderActiveSlide();
}

function indexFromHash(): number {
  const match = window.location.hash.match(/slide-(\d+)/);
  const parsed = match ? Number(match[1]) - 1 : 0;
  return clamp(Number.isFinite(parsed) ? parsed : 0, 0, SLIDES.length - 1);
}

function cloneVectors(vectors: VectorItem[]): VectorItem[] {
  return vectors.map((vector) => ({
    ...vector,
    value: cloneVec2(vector.value),
  }));
}

function cloneComplexItems(items: ComplexItem[]): ComplexItem[] {
  return items.map((item) => ({
    ...item,
    value: cloneVec2(item.value),
  }));
}

function clonePair(pair: PairSelection): PairSelection {
  return {
    firstId: pair.firstId,
    secondId: pair.secondId,
  };
}

function cloneVec2(value: Vec2): Vec2 {
  return { x: value.x, y: value.y };
}

function matricesEqual(a: Mat2, b: Mat2): boolean {
  const diff =
    Math.abs(a[0][0] - b[0][0]) +
    Math.abs(a[0][1] - b[0][1]) +
    Math.abs(a[1][0] - b[1][0]) +
    Math.abs(a[1][1] - b[1][1]);
  return diff < 1e-8;
}

function vectorsEqual(a: Vec2, b: Vec2): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 1e-8;
}

function formatNumber(value: number): string {
  if (Math.abs(value) < 1e-10) {
    return "0";
  }
  return Number(value.toFixed(3)).toString();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mustGetElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

async function typesetMath(element: Element, attempts = 20): Promise<void> {
  const typeset = window.MathJax?.typesetPromise;
  if (!typeset) {
    if (attempts > 0) {
      await new Promise<void>((resolve) => {
        window.setTimeout(() => {
          void typesetMath(element, attempts - 1).then(resolve);
        }, 120);
      });
    }
    return;
  }

  await typeset([element]);
}

function isEditingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLButtonElement
  );
}

function assertNever(value: never): never {
  throw new Error(`Unexpected slide spec: ${JSON.stringify(value)}`);
}
