import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { AppState } from "../app/types";
import { blochCoordinates } from "../math/qubit";

export type BlochRenderer = {
  render: () => void;
  setVisible: (visible: boolean) => void;
};

export function createBlochRenderer(root: HTMLElement, state: AppState): BlochRenderer {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f7f9fa");

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(2.6, 1.8, 2.6);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  root.append(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.1;
  controls.maxDistance = 5.2;

  scene.add(new THREE.AmbientLight("#ffffff", 0.72));
  const light = new THREE.DirectionalLight("#ffffff", 1.2);
  light.position.set(2, 3, 2);
  scene.add(light);

  scene.add(createSphere());
  scene.add(createEquator());
  addAxes(scene);

  const stateArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    1.08,
    0xd13f31,
    0.12,
    0.07,
  );
  scene.add(stateArrow);

  const stateTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0xd13f31 }),
  );
  scene.add(stateTip);

  addLabel(scene, "|0>", new THREE.Vector3(0, 1.24, 0), "#172026");
  addLabel(scene, "|1>", new THREE.Vector3(0, -1.24, 0), "#172026");
  addLabel(scene, "x", new THREE.Vector3(1.32, 0, 0), "#d13f31");
  addLabel(scene, "y", new THREE.Vector3(0, 0, 1.32), "#008da6");
  addLabel(scene, "z", new THREE.Vector3(0, 1.42, 0), "#1f6feb");

  let visible = false;

  function render(): void {
    resizeRenderer(root, renderer, camera);
    updateStateVector(state, stateArrow, stateTip);
    renderer.render(scene, camera);
  }

  function animate(): void {
    requestAnimationFrame(animate);
    if (!visible) {
      return;
    }
    controls.update();
    render();
  }
  animate();

  return {
    render,
    setVisible(nextVisible: boolean): void {
      visible = nextVisible;
      root.classList.toggle("visible", nextVisible);
      if (nextVisible) {
        render();
      }
    },
  };
}

function createSphere(): THREE.Object3D {
  const group = new THREE.Group();
  const solid = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      roughness: 0.7,
      metalness: 0,
    }),
  );
  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(1.002, 32, 16),
    new THREE.MeshBasicMaterial({
      color: 0x8b9aa3,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
    }),
  );
  group.add(solid, wire);
  return group;
}

function createEquator(): THREE.LineLoop {
  const points: THREE.Vector3[] = [];
  for (let index = 0; index < 128; index += 1) {
    const angle = (index / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
  }
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x65737d, transparent: true, opacity: 0.62 }),
  );
}

function addAxes(scene: THREE.Scene): void {
  addAxis(scene, new THREE.Vector3(-1.22, 0, 0), new THREE.Vector3(1.22, 0, 0), 0xd13f31);
  addAxis(scene, new THREE.Vector3(0, -1.22, 0), new THREE.Vector3(0, 1.22, 0), 0x1f6feb);
  addAxis(scene, new THREE.Vector3(0, 0, -1.22), new THREE.Vector3(0, 0, 1.22), 0x008da6);
}

function addAxis(
  scene: THREE.Scene,
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: number,
): void {
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([start, end]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.78 }),
    ),
  );
}

function updateStateVector(
  state: AppState,
  arrow: THREE.ArrowHelper,
  tip: THREE.Mesh,
): void {
  const bloch = blochCoordinates(state.qubitAlpha, state.qubitBeta);
  const direction = new THREE.Vector3(bloch.x, bloch.z, bloch.y);
  if (direction.lengthSq() < 1e-10) {
    direction.set(0, 1, 0);
  }
  direction.normalize();
  arrow.setDirection(direction);
  arrow.setLength(1.08, 0.12, 0.07);
  tip.position.copy(direction.clone().multiplyScalar(1.04));
}

function addLabel(
  scene: THREE.Scene,
  text: string,
  position: THREE.Vector3,
  color: string,
): void {
  const sprite = makeTextSprite(text, color);
  sprite.position.copy(position);
  scene.add(sprite);
}

function makeTextSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create text sprite context.");
  }

  context.font = "32px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  const metrics = context.measureText(text);
  canvas.width = Math.ceil(metrics.width + 24);
  canvas.height = 48;
  context.font = "32px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(canvas.width / 170, canvas.height / 170, 1);
  return sprite;
}

function resizeRenderer(
  root: HTMLElement,
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
): void {
  const width = Math.max(1, root.clientWidth);
  const height = Math.max(1, root.clientHeight);
  const canvas = renderer.domElement;

  const targetWidth = Math.floor(width * renderer.getPixelRatio());
  const targetHeight = Math.floor(height * renderer.getPixelRatio());

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}
