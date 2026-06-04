import { VECTOR_COLORS } from "../app/state";
import type {
  Bounds,
  ComplexConcepts,
  ComplexItem,
  DojoMode,
  Mat2,
  PairSelection,
  Vec2,
  VectorItem,
} from "../app/types";

const qcampLogo = new URL("../../images/QcampLogo.svg", import.meta.url).href;
const cqtLogo = new URL("../../images/CQT-logo-black-vertical.svg", import.meta.url).href;

export type ScenePreset = {
  mode: DojoMode;
  vectors?: VectorItem[];
  selectedVectorId?: string | null;
  scalarVectorId?: string | null;
  scalarMultiplier?: number;
  showComponentLegs?: boolean;
  pairSelection?: PairSelection;
  complexNumbers?: ComplexItem[];
  selectedComplexId?: string | null;
  complexConcepts?: Partial<ComplexConcepts>;
  complexAdditionSelection?: PairSelection;
  complexMultiplicationSelection?: PairSelection;
  complexUnaryId?: string | null;
  complexRotationTheta?: number;
  transformMatrix?: Mat2;
  transformT?: number;
  showAxisCoordinates?: boolean;
  zoomOut?: number;
  pan?: Vec2;
};

export type MatrixPresetSpec = {
  label: string;
  matrix: Mat2;
  transformT?: number;
};

export type ControlSpec =
  | {
      kind: "scalar";
      label: string;
      min: number;
      max: number;
      step: number;
    }
  | {
      kind: "linear-combo";
      firstId: string;
      secondId: string;
      firstBase: Vec2;
      secondBase: Vec2;
      firstInitial: number;
      secondInitial: number;
    }
  | {
      kind: "matrix-presets";
      presets: MatrixPresetSpec[];
    }
  | {
      kind: "transform";
      label: string;
    }
  | {
      kind: "complex-angle";
      targetId: string;
      label: string;
      initialTheta: number;
    }
  | {
      kind: "complex-i-powers";
      multiplierId: string;
    };

export type ReadoutKind =
  | "pair"
  | "scalar"
  | "linear-combo"
  | "complex"
  | "complex-arithmetic"
  | "complex-polar"
  | "matrix"
  | "determinant"
  | "matrix-product";

export type SceneFitSpec = {
  bounds?: Bounds | (() => Bounds);
  padding?: number;
  minScale?: number;
  maxScale?: number;
  minWorldSpan?: number;
};

export type VisualSpec = {
  kind: "canvas";
  scene: ScenePreset;
  fit?: false | SceneFitSpec;
  controls?: ControlSpec[];
  readout?: ReadoutKind;
};

export type SlideSpec = {
  title: string;
  subtitle?: string;
  body: string;
  visual?: VisualSpec;
  layout?: "title" | "section" | "split" | "wide";
};

const ROTATE_45: Mat2 = [
  [Math.SQRT1_2, -Math.SQRT1_2],
  [Math.SQRT1_2, Math.SQRT1_2],
];

const SCALE_REFLECT_Y: Mat2 = [
  [-2, 0],
  [0, 2],
];

const SHEAR: Mat2 = [
  [1, 0.85],
  [0, 1],
];

const STRETCH: Mat2 = [
  [1.4, 0],
  [0, 0.72],
];

const MATRIX_PRESETS: MatrixPresetSpec[] = [
  {
    label: "Identity",
    matrix: [
      [1, 0],
      [0, 1],
    ],
  },
  { label: "Rotate 45", matrix: ROTATE_45 },
  { label: "Shear", matrix: SHEAR },
  { label: "Stretch", matrix: STRETCH },
  {
    label: "Reflect y",
    matrix: SCALE_REFLECT_Y,
  },
];

const MATRIX_PRODUCT_PRESETS: MatrixPresetSpec[] = [
  {
    label: "A",
    matrix: [
      [1, 1],
      [0, 1],
    ],
  },
  {
    label: "B",
    matrix: [
      [1, 0],
      [1, 1],
    ],
  },
  {
    label: "AB",
    matrix: [
      [2, 1],
      [1, 1],
    ],
  },
  {
    label: "BA",
    matrix: [
      [1, 1],
      [1, 2],
    ],
  },
];

const tex = String.raw;

function math(source: string): string {
  return `<span class="math-inline">\\(${source}\\)</span>`;
}

function display(source: string): string {
  return `<div class="math-line">\\[${source}\\]</div>`;
}

function vectorItem(id: string, label: string, x: number, y: number, colorIndex: number): VectorItem {
  return {
    id,
    label,
    value: { x, y },
    color: VECTOR_COLORS[colorIndex % VECTOR_COLORS.length],
  };
}

function complexItem(id: string, label: string, x: number, y: number, colorIndex: number): ComplexItem {
  return {
    id,
    label,
    value: { x, y },
    color: VECTOR_COLORS[colorIndex % VECTOR_COLORS.length],
  };
}

function algebraScene(vectors: VectorItem[], extras: Partial<ScenePreset> = {}): ScenePreset {
  return {
    mode: "algebra",
    vectors,
    selectedVectorId: vectors[0]?.id ?? null,
    showComponentLegs: true,
    zoomOut: 0,
    ...extras,
  };
}

function complexScene(numbers: ComplexItem[], extras: Partial<ScenePreset> = {}): ScenePreset {
  return {
    mode: "complex",
    complexNumbers: numbers,
    selectedComplexId: numbers[0]?.id ?? null,
    complexUnaryId: numbers[0]?.id ?? null,
    showAxisCoordinates: true,
    zoomOut: 0,
    ...extras,
  };
}

function geometryScene(matrix: Mat2, extras: Partial<ScenePreset> = {}): ScenePreset {
  return {
    mode: "geometry",
    vectors: [vectorItem("v1", "v", 1.15, 0.65, 0)],
    selectedVectorId: "v1",
    transformMatrix: matrix,
    transformT: 1,
    showComponentLegs: false,
    zoomOut: 0.2,
    ...extras,
  };
}

export const SLIDES: SlideSpec[] = [
  {
    title: "Linear Algebra and Complex Numbers",
    subtitle: "QCamp 2026",
    layout: "title",
    body: `
      <p class="authors">Aditya Morolia, Becca Verghese</p>
      <div class="title-logos" aria-label="QCamp and CQT logos">
        <img src="${qcampLogo}" alt="QCamp logo" />
        <img src="${cqtLogo}" alt="CQT logo" />
      </div>
    `,
  },
  {
    title: "Linear Algebra",
    layout: "section",
    body: "<p>Vectors, addition, scaling, combinations.</p>",
  },
  {
    title: "Vectors",
    layout: "split",
    body: `
      <ul>
        <li>Linear algebra: study of <span class="defn">vector</span> spaces.</li>
        <li>Vectors: A collection of numbers.</li>
      </ul>
      ${display(tex`\vec{v} = \ket{v} = \begin{pmatrix}2\\5\\1.4\\\vdots\end{pmatrix}`)}
      <p class="speaker-note">Adi: Lots of uses. You can add them. You can count them. They have geometric properties.</p>
    `,
    visual: {
      kind: "canvas",
      scene: algebraScene([vectorItem("v1", "v", 1.2, 0.72, 0)]),
    },
  },
  {
    title: "Vectors",
    layout: "split",
    body: `
      <p>A thing with length and direction.</p>
      <p>Example: ${math(tex`\ket{v} = \begin{pmatrix}2\\1\end{pmatrix}`)}.</p>
      <p>Dimension: number of scalars.</p>
      <p>Vectors can also be built over <span class="defn">complex numbers</span>.</p>
    `,
    visual: {
      kind: "canvas",
      scene: algebraScene([vectorItem("v1", "v", 2, 1, 0)]),
    },
  },
  {
    title: "Why Linear Algebra?: Addition",
    layout: "split",
    body: `
      ${display(tex`\ket{v} = \begin{pmatrix}a\\b\\c\end{pmatrix} \qquad \ket{w} = \begin{pmatrix}d\\e\\f\end{pmatrix}`)}
      ${display(tex`\ket{v} + \ket{w} = \begin{pmatrix}a+d\\b+e\\c+f\end{pmatrix}`)}
    `,
    visual: {
      kind: "canvas",
      scene: algebraScene(
        [vectorItem("v1", "v", 1.1, 0.62, 0), vectorItem("v2", "w", 0.46, 1.08, 1)],
        {
          pairSelection: { firstId: "v1", secondId: "v2" },
          selectedVectorId: "v1",
          showComponentLegs: false,
        },
      ),
      readout: "pair",
    },
  },
  {
    title: "Why Linear Algebra?: Scalar Multiplication",
    layout: "split",
    body: `
      <p>${math(tex`k \in \R`)} is some scalar, ${math(tex`\ket{v} = \begin{pmatrix}a\\b\\c\end{pmatrix}`)}</p>
      <div class="mybox">
        <strong>Scaling:</strong>
        ${display(tex`k\ket{v} = \begin{pmatrix}ka\\kb\\kc\end{pmatrix}`)}
      </div>
      <p>How can we multiply two vectors together? Stay tuned...</p>
    `,
    visual: {
      kind: "canvas",
      scene: algebraScene([vectorItem("v1", "v", 1.05, 0.68, 0)], {
        scalarVectorId: "v1",
        scalarMultiplier: 1.8,
      }),
      controls: [{ kind: "scalar", label: "Scalar multiplier", min: -3, max: 3, step: 0.05 }],
      readout: "scalar",
    },
  },
  {
    title: "Linear Combinations of Vectors",
    layout: "split",
    body: `
      <div class="mybox">
        <strong>Definition:</strong> A <span class="defn">linear combination</span> of vectors is a collection
        ${math(tex`c_0\ket{v_0} + c_1\ket{v_1} + \cdots + c_n\ket{v_n}`)}
        where ${math(tex`c_0,\ldots,c_n`)} are scalars and ${math(tex`\ket{v_0},\ldots,\ket{v_n}`)} are vectors.
      </div>
      <p>We can define a vector as ${math(tex`\ket{\psi} = c_0\ket{v_0} + c_1\ket{v_1}`)}</p>
    `,
    visual: {
      kind: "canvas",
      scene: algebraScene(
        [vectorItem("v1", "v0", 1.1, 0.45, 0), vectorItem("v2", "v1", 0.35, 1.05, 1)],
        {
          pairSelection: { firstId: "v1", secondId: "v2" },
          showComponentLegs: false,
        },
      ),
      controls: [
        {
          kind: "linear-combo",
          firstId: "v1",
          secondId: "v2",
          firstBase: { x: 1.1, y: 0.45 },
          secondBase: { x: 0.35, y: 1.05 },
          firstInitial: 1,
          secondInitial: 1,
        },
      ],
      readout: "linear-combo",
    },
  },
  {
    title: "Complex Numbers",
    layout: "section",
    body: "<p>Roots, imaginary numbers, and the complex plane.</p>",
  },
  {
    title: "Finding The Roots of Polynomials",
    layout: "wide",
    body: `
      <p>What are the solutions to ${math(tex`x^2 - 1 = 0`)}?</p>
      <p>What about ${math(tex`x^2 + 1 = 0`)}?</p>
    `,
  },
  {
    title: "Introducing the Imaginary Number!",
    layout: "wide",
    body: `
      <div class="mybox">
        <strong>Definition:</strong>
        ${display(tex`i := \sqrt{-1}, \qquad i \in \I \text{ is an imaginary number}`)}
      </div>
      <p>What are the solutions to ${math(tex`x^2 + 5 = 0`)}?</p>
      <ul>
        <li>${math(tex`x = \pm\sqrt{-5} = \pm i\sqrt{5}`)}</li>
      </ul>
    `,
  },
  {
    title: "Complex Numbers",
    layout: "split",
    body: `
      <div class="mybox">
        <strong>Definition:</strong> A <span class="defn">complex number</span> ${math(tex`z \in \C`)} has the form
        ${display(tex`z = a + bi`)}
        where ${math(tex`a,b \in \R`)}
      </div>
      <ul>
        <li>${math(tex`a`)} is the real part of ${math(tex`z`)}, ${math(tex`a = \operatorname{Re}(z)`)}</li>
        <li>${math(tex`b`)} is the imaginary part of ${math(tex`z`)}, ${math(tex`b = \operatorname{Im}(z)`)}</li>
        <li>Identify ${math(tex`z`)} with ${math(tex`\vec{z} = (a,b)`)}?</li>
      </ul>
    `,
    visual: {
      kind: "canvas",
      scene: complexScene([complexItem("c1", "z", 1.1, 0.85, 0)], {
        complexConcepts: { polar: true },
      }),
      readout: "complex-polar",
    },
  },
  {
    title: "Properties of Complex Numbers: Arithmetic",
    layout: "split",
    body: `
      <p>Let ${math(tex`z = a + bi; \qquad w = c + di`)}</p>
      <div class="mybox">
        <strong>Addition:</strong>
        ${display(tex`z \pm w = (a+bi) \pm (c+di) = (a+c) + (b+d)i`)}
      </div>
      <div class="mybox">
        <strong>Multiplication:</strong>
        ${display(tex`zw = (a+bi)(c+di) = (ac-bd) + (ad+bc)i`)}
      </div>
    `,
    visual: {
      kind: "canvas",
      scene: complexScene(
        [complexItem("c1", "z", 1.0, 0.7, 0), complexItem("c2", "w", 0.55, 1.05, 1)],
        {
          complexConcepts: { addition: true, multiplication: true },
          complexAdditionSelection: { firstId: "c1", secondId: "c2" },
          complexMultiplicationSelection: { firstId: "c1", secondId: "c2" },
        },
      ),
      readout: "complex-arithmetic",
    },
  },
  {
    title: "Properties of Complex Numbers: Conjugates, Modulus",
    layout: "split",
    body: `
      <div class="mybox">
        <strong>Definition:</strong> The <span class="defn">complex conjugate</span> of ${math(tex`z = a+bi`)} is ${math(tex`z^* = a-bi`)}.
      </div>
      <p>What is ${math(tex`zz^*`)}? ... the modulus!!</p>
      <div class="mybox">
        <strong>Definition:</strong> The <span class="defn">modulus</span> of ${math(tex`z`)} is
        ${display(tex`|z| = \sqrt{a^2+b^2} = \sqrt{zz^*}`)}
      </div>
    `,
    visual: {
      kind: "canvas",
      scene: complexScene([complexItem("c1", "z", 1.1, 0.9, 0)], {
        complexConcepts: { conjugate: true, polar: true },
      }),
      readout: "complex-polar",
    },
  },
  {
    title: "Enter Geometry: Visualizing Numbers",
    layout: "wide",
    body: `
      <p>How do we visualize the real numbers?</p>
      <p>What about the complex numbers?</p>
    `,
  },
  {
    title: "The Complex Plane",
    layout: "split",
    body: `
      <p>The real numbers ${math(tex`\rightarrow`)} 1D line ... the complex numbers ${math(tex`\rightarrow`)} a 2D plane!</p>
      <p>We can also write ${math(tex`z`)} as</p>
      ${display(tex`z = |z|(\cos\theta + i\sin\theta)`)}
    `,
    visual: {
      kind: "canvas",
      scene: complexScene([complexItem("c1", "z", 1.18, 1.02, 0)], {
        complexConcepts: { polar: true },
      }),
      readout: "complex-polar",
    },
  },
  {
    title: "Playing Around with the Complex Plane!",
    layout: "split",
    body: `
      <p>Explore the following:</p>
      <ul>
        <li>What happens when you multiply a number by ${math(tex`i`)}? By ${math(tex`i^2, i^3, i^4`)}?</li>
        <li>What is the graphical relation between ${math(tex`z`)} and ${math(tex`z^*`)}?</li>
      </ul>
    `,
    visual: {
      kind: "canvas",
      scene: complexScene(
        [complexItem("c1", "z", 1.1, 0.55, 0), complexItem("c2", "i", 0, 1, 2)],
        {
          complexConcepts: { multiplication: true, conjugate: true },
          complexMultiplicationSelection: { firstId: "c1", secondId: "c2" },
          complexUnaryId: "c1",
        },
      ),
      controls: [{ kind: "complex-i-powers", multiplierId: "c2" }],
      readout: "complex-arithmetic",
    },
  },
  {
    title: "Euler's Formula",
    layout: "split",
    body: `
      <div class="mybox">
        <strong>Euler's Formula:</strong>
        ${display(tex`e^{i\theta} = \cos\theta + i\sin\theta`)}
      </div>
      ${display(tex`\Longrightarrow z = |z|(\cos\theta + i\sin\theta) = |z|e^{i\theta}`)}
    `,
    visual: {
      kind: "canvas",
      scene: complexScene([complexItem("c1", "e^(i theta)", Math.SQRT1_2, Math.SQRT1_2, 0)], {
        complexConcepts: { polar: true },
      }),
      controls: [{ kind: "complex-angle", targetId: "c1", label: "Angle theta", initialTheta: Math.PI / 4 }],
      readout: "complex-polar",
    },
  },
  {
    title: "Exploring Euler's Formula",
    layout: "wide",
    body: `
      <p>What is ${math(tex`z^n`)}?</p>
      ${display(tex`z^n = (|z|e^{i\theta})^n = |z|^n e^{in\theta} = |z|^n(\cos n\theta + i\sin n\theta)`)}
      <p>${math(tex`\Rightarrow`)} DeMoivre's Theorem!</p>
      <p>What is ${math(tex`i^i`)}?</p>
      ${display(tex`i^i = (e^{i\pi/2})^i = e^{i^2\pi/2} = e^{-\pi/2}`)}
      <p>${math(tex`\Rightarrow`)} What!?! That's a real number!!</p>
    `,
  },
  {
    title: "Back to the space of vectors!",
    layout: "section",
    body: "<p>Inner products, matrices, and products of vectors.</p>",
  },
  {
    title: "Vectors: Transpose",
    layout: "wide",
    body: `
      <div class="mybox">
        <strong>Definition:</strong> If
        ${math(tex`\vec{v} = \ket{v} = \begin{pmatrix}a\\b\\c\end{pmatrix}`)}
        is a vector, then its <span class="defn">transpose</span> is
        ${display(tex`(\vec{v})^T = \begin{pmatrix}a & b & c\end{pmatrix}.`)}
      </div>
    `,
  },
  {
    title: "Vectors: Adjoint",
    layout: "wide",
    body: `
      <p>Vectors can also have complex entries.</p>
      <div class="mybox">
        <strong>Definition:</strong> If
        ${math(tex`\ket{v} = \begin{pmatrix}z_0\\z_1\\z_2\end{pmatrix}`)}
        is a vector in ${math(tex`\C^3`)}, then its <span class="defn">adjoint</span> is
        ${math(tex`(\ket{v})^{\dagger} = \bra{v} = \begin{pmatrix}z_0^* & z_1^* & z_2^*\end{pmatrix}`)}
      </div>
    `,
  },
  {
    title: "Vector Multiplication? Inner Products",
    layout: "wide",
    body: `
      <ul>
        <li>How do you multiply two vectors? What does it even mean to "multiply" two vectors?</li>
      </ul>
      <div class="mybox">
        <strong>Definition:</strong> The <span class="defn">inner product</span> between two vectors
        ${math(tex`\ket{v} = \begin{pmatrix}v_0\\v_1\end{pmatrix}, \ket{w} = \begin{pmatrix}w_0\\w_1\end{pmatrix}`)}
        is
        ${display(tex`\langle v|w\rangle = \begin{pmatrix}v_0^* & v_1^*\end{pmatrix}\begin{pmatrix}w_0\\w_1\end{pmatrix} = v_0^*w_0 + v_1^*w_1`)}
      </div>
      <ul>
        <li>Inner Product: 2 vectors ${math(tex`\Rightarrow`)} number</li>
      </ul>
    `,
  },
  {
    title: "Properties of Inner Product",
    layout: "wide",
    body: `
      <div class="mybox">
        <strong>Definition:</strong> If ${math(tex`\langle v|w\rangle = 0`)} ${math(tex`\Rightarrow`)} ${math(tex`\ket{v}, \ket{w}`)} are <span class="defn">orthogonal</span>
      </div>
      <div class="mybox">
        <strong>Definition:</strong> The <span class="defn">norm</span> of a vector ${math(tex`\ket{v}`)} is ${math(tex`\lVert v\rVert = \sqrt{\langle v|v\rangle}`)}
      </div>
      <ul>
        <li>norm &approx; generalized length</li>
        <li>If ${math(tex`\lVert v\rVert = 1`)}, ${math(tex`\ket{v}`)} is <span class="defn">normalized</span></li>
      </ul>
    `,
  },
  {
    title: "Matrix as Linear Transforms",
    layout: "split",
    body: `
      <ul>
        <li>How can we model how vectors change?</li>
        <li>How can we represent the action of rotating a vector</li>
      </ul>
      <div class="mybox">
        <strong>Definition:</strong> A <span class="defn">matrix</span> is an object that linearly transforms vectors.
        ${display(tex`M = \begin{bmatrix}a & b\\c & d\end{bmatrix} = \begin{bmatrix}\vec{v_0} & \vec{v_1}\end{bmatrix}`)}
      </div>
    `,
    visual: {
      kind: "canvas",
      scene: geometryScene(ROTATE_45, { transformT: 1 }),
      controls: [{ kind: "matrix-presets", presets: MATRIX_PRESETS }, { kind: "transform", label: "Transform amount" }],
      readout: "matrix",
    },
  },
  {
    title: "Matrix Addition",
    layout: "wide",
    body: `
      <p>${math(tex`A = \begin{bmatrix}a_{00} & a_{01}\\a_{10} & a_{11}\end{bmatrix}`)},
      ${math(tex`B = \begin{bmatrix}b_{00} & b_{01}\\b_{10} & b_{11}\end{bmatrix}`)}</p>
      <div class="mybox">
        <strong>Addition:</strong>
        ${display(tex`A + B = \begin{bmatrix}a_{00}+b_{00} & a_{01}+b_{01}\\a_{10}+b_{10} & a_{11}+b_{11}\end{bmatrix}`)}
      </div>
      <p>How is this similar to vector addition?</p>
    `,
  },
  {
    title: "Scalar Multiplication for Matrices",
    layout: "wide",
    body: `
      <p>${math(tex`A = \begin{bmatrix}a_{00} & a_{01}\\a_{10} & a_{11}\end{bmatrix}`)}, scalar ${math(tex`c`)}</p>
      <div class="mybox">
        <strong>Scalar Multiplication:</strong>
        ${display(tex`cA = \begin{bmatrix}c a_{00} & c a_{01}\\c a_{10} & c a_{11}\end{bmatrix}`)}
      </div>
    `,
  },
  {
    title: "Matrix-Vector Multiplication",
    layout: "split",
    body: `
      <p>Matrices linearly transform vectors.</p>
      <p>${math(tex`M = \begin{bmatrix}a_{00} & a_{01}\\a_{10} & a_{11}\end{bmatrix}`)},
      ${math(tex`\ket{v} = \begin{pmatrix}v_0\\v_1\end{pmatrix}`)}</p>
      <div class="mybox">
        <strong>Matrix-Vector Transform:</strong>
        ${display(tex`M\ket{v} = \begin{pmatrix}a_{00}v_0 + a_{01}v_1\\a_{10}v_0 + a_{11}v_1\end{pmatrix}`)}
      </div>
    `,
    visual: {
      kind: "canvas",
      scene: geometryScene(SHEAR, {
        vectors: [vectorItem("v1", "v", 0.86, 1.1, 0)],
        selectedVectorId: "v1",
      }),
      controls: [{ kind: "matrix-presets", presets: MATRIX_PRESETS }, { kind: "transform", label: "Transform amount" }],
      readout: "matrix",
    },
  },
  {
    title: "Matrix Multiplication",
    layout: "split",
    body: `
      <p>${math(tex`A = \begin{bmatrix}a_{00} & a_{01}\\a_{10} & a_{11}\end{bmatrix}`)},
      ${math(tex`B = \begin{bmatrix}b_{00} & b_{01}\\b_{10} & b_{11}\end{bmatrix}`)}</p>
      <div class="mybox">
        <strong>Matrix Multiplication:</strong>
        ${display(tex`AB = \begin{bmatrix}a_{00}b_{00} + a_{01}b_{10} & a_{00}b_{01} + a_{01}b_{11}\\a_{10}b_{00} + a_{11}b_{10} & a_{10}b_{01} + a_{11}b_{11}\end{bmatrix}`)}
      </div>
      <p>What is ${math(tex`BA`)}?</p>
    `,
    visual: {
      kind: "canvas",
      scene: geometryScene(MATRIX_PRODUCT_PRESETS[2].matrix),
      controls: [{ kind: "matrix-presets", presets: MATRIX_PRODUCT_PRESETS }],
      readout: "matrix-product",
    },
  },
  {
    title: "Determinant",
    layout: "split",
    body: `
      <ul>
        <li>How much does a matrix transform the area of a region?</li>
      </ul>
      <div class="mybox">
        <strong>Definition:</strong> The <span class="defn">determinant</span> of a matrix is
        ${display(tex`\det(A) = \det\begin{bmatrix}a & b\\c & d\end{bmatrix} = \left|\begin{matrix}a & b\\c & d\end{matrix}\right| = ad - bc`)}
      </div>
    `,
    visual: {
      kind: "canvas",
      scene: algebraScene(
        [vectorItem("v1", "col1", 1.15, 0.35, 0), vectorItem("v2", "col2", 0.35, 1.1, 1)],
        {
          pairSelection: { firstId: "v1", secondId: "v2" },
          selectedVectorId: "v1",
          showComponentLegs: false,
        },
      ),
      readout: "determinant",
    },
  },
  {
    title: "Eigenvectors and Eigenvalues",
    layout: "split",
    body: `
      <ul>
        <li>${math(tex`M`)} is a matrix that scales all vectors by 2 and flips them over the ${math(tex`y`)} axis. What happens to the vector ${math(tex`\ket{v} = \begin{pmatrix}0\\1\end{pmatrix}`)}?</li>
        <li>${math(tex`\ket{v}`)}'s direction doesn't change</li>
      </ul>
      <div class="mybox">
        <strong>Definition:</strong> A vector ${math(tex`\ket{v}`)} is called an <span class="defn">eigenvector</span> of a matrix ${math(tex`M`)} if
        ${display(tex`M\ket{v} = \lambda\ket{v}`)}
        the scaling factor ${math(tex`\lambda`)} is the <span class="defn">eigenvalue</span>.
      </div>
    `,
    visual: {
      kind: "canvas",
      scene: {
        ...geometryScene(SCALE_REFLECT_Y, {
          mode: "eigenvectors",
          vectors: [vectorItem("v1", "v", 0, 1, 0)],
          selectedVectorId: "v1",
        }),
        mode: "eigenvectors",
      },
      controls: [{ kind: "matrix-presets", presets: MATRIX_PRESETS }],
      readout: "matrix",
    },
  },
  {
    title: "Kronecker Product",
    layout: "wide",
    body: `
      <p>Two systems: Lab and an Environment</p>
      <ul>
        <li>How do you model the two systems together?</li>
        <li>${math(tex`\ket{v} = \begin{pmatrix}a\\b\end{pmatrix} \in \text{Lab}`)}, ${math(tex`\ket{w} = \begin{pmatrix}c\\d\end{pmatrix} \in \text{Environment}`)}</li>
      </ul>
      <div class="mybox">
        <strong>Definition:</strong> The <span class="defn">Kronecker product</span> between two vectors is
        ${display(tex`\ket{v} \otimes \ket{w} = \begin{pmatrix}ac\\ad\\bc\\bd\end{pmatrix}`)}
      </div>
      <p>${math(tex`\ket{v} \otimes \ket{w} \in \text{Lab and Environment}`)}</p>
    `,
  },
  {
    title: "Complex Matrices",
    layout: "wide",
    body: `
      <p>Matrices can have complex entries. ${math(tex`M = \begin{bmatrix}z_{00} & z_{01}\\z_{10} & z_{11}\end{bmatrix}`)}</p>
      <div class="mybox">
        <strong>Definition:</strong> The <span class="defn">Hermitian conjugate</span> of a matrix is
        ${display(tex`M^\dagger = \begin{bmatrix}z_{00}^* & z_{10}^*\\z_{01}^* & z_{11}^*\end{bmatrix}`)}
      </div>
      <ul>
        <li>If ${math(tex`M = M^\dagger`)} ${math(tex`\Rightarrow`)} ${math(tex`M`)} is <span class="defn">Hermitian</span>.</li>
        <li>If ${math(tex`MM^\dagger = I`)} ${math(tex`\Rightarrow`)} ${math(tex`M`)} is <span class="defn">unitary</span>.</li>
      </ul>
    `,
  },
  {
    title: "Turning Vectors into Matrices",
    layout: "wide",
    body: `
      <div class="mybox">
        <strong>Definition:</strong> The <span class="defn">outer product</span> of two vectors ${math(tex`\ket{v} = \begin{pmatrix}a\\b\end{pmatrix}`)}, ${math(tex`\ket{w} = \begin{pmatrix}c\\d\end{pmatrix}`)} is
        ${display(tex`\ket{v}\bra{w} = \begin{pmatrix}a\\b\end{pmatrix}\begin{pmatrix}c^* & d^*\end{pmatrix} = \begin{bmatrix}ac^* & ad^*\\bc^* & bd^*\end{bmatrix}`)}
      </div>
      <p>What is the difference between an inner product ${math(tex`\langle v|w\rangle`)}, a Kronecker product ${math(tex`\ket{v} \otimes \ket{w}`)}, and an outer product ${math(tex`\ket{v}\bra{w}`)}?</p>
      <ul>
        <li>Inner product: 2 vectors ${math(tex`\Rightarrow`)} number</li>
        <li>Kronecker product: 2 vectors ${math(tex`\Rightarrow`)} vector</li>
        <li>Outer product: 2 vectors ${math(tex`\Rightarrow`)} matrix</li>
      </ul>
    `,
  },
];
