import "./style.css";
import { createInitialState } from "./app/state";
import { bindPointerInteractions } from "./interaction/pointer";
import { createRenderer } from "./render/renderer";
import { bindControls } from "./ui/controls";
import { mustGetElement } from "./ui/dom";

const canvas = mustGetElement<HTMLCanvasElement>("dojo-canvas");
const blochRoot = mustGetElement<HTMLElement>("bloch-root");
const state = createInitialState();
const renderer = createRenderer(canvas, blochRoot, state);
const controls = bindControls(state, renderer.redraw);

bindPointerInteractions(canvas, state, renderer.redraw, controls.syncFromState);
renderer.redraw();
