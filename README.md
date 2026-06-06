## Math Visualization

This repository is a collection of interactive visualization tools and a slide deck for teaching complex numbers and linear algebra for quantum mechanics.
This is tailored towards high school students. 
This is a lightweight personal tool that does not contain any tests or build optimizations. 
The tools are built with TypeScript and HTML canvas, and the slide deck is authored in TypeScript. 
We use Vite as the build tool.
At the beginning this was mostly vibe coded using ChatGPT.

## Slide deck

The HTML slide deck is authored in `src/slides/deck.ts`. Think of each object in `SOURCE_SLIDES` as a Beamer `frame`.

```ts
{
  title: "Complex Numbers",
  subtitle: "Arithmetic and geometry",
  layout: "split",
  body: `
    <p>A slide body can use normal HTML.</p>
  `,
}
```

### Frame Fields

- `title`: The main slide title.
- `subtitle`: Optional smaller text rendered directly below the title.
- `layout`: Use `"title"`, `"section"`, `"split"`, or `"wide"`.
- `body`: The slide content, written as an HTML template string.
- `visual`: Optional interactive canvas scene shown beside the text.

### Layouts

- `"title"`: Use for the opening title slide. It centers the title, subtitle, and title-page content such as logos.
- `"section"`: Use like Beamer section divider frames. It centers a large title and short body text, with no visual panel.
- `"split"`: Use for the usual teaching slide with text on the left and an optional interactive canvas on the right. This is the default if no `layout` is set.
- `"wide"`: Use when the body needs most of the slide width, such as derivations, long equations, or discussion prompts. If a visual is present, the slide stacks the title/text above the visual.

### Math

Use the `tex` tag with the helpers in `deck.ts`.

```ts
${math(tex`z = a + bi`)}
${display(tex`z = |z|(\cos\theta + i\sin\theta)`)}
```

- `math(...)` is like inline LaTeX math, using `\(...\)`.
- `display(...)` is like display math, using `\[...\]`, with consistent slide spacing.
- The `tex` tag is `String.raw`, so backslashes can be written like normal LaTeX.

### Pauses

Use `${pause}` where you would use `\pause` in Beamer.

```ts
body: `
  <p>First idea.</p>
  ${pause}
  <p>Second idea.</p>
`,
```

Pause overlays reserve the final layout space, like Beamer. Earlier content should not shift when later content appears.

### Highlight Boxes

Use `.mybox` for definition-style highlighted blocks.

```ts
body: `
  <div class="mybox">
    A <span class="defn">complex number</span> has the form
    ${display(tex`z = a + bi`)}
  </div>
`,
```

Use `<span class="defn">...</span>` to emphasize the term being defined.

### Interactive Visuals

Slides can include a `visual` with a canvas scene, optional controls, and optional readouts.

```ts
visual: {
  kind: "canvas",
  scene: complexScene([complexItem("c1", "z", 1.1, 0.85, 0)]),
  readout: "complex-polar",
}
```

Common helpers include `algebraScene(...)`, `complexScene(...)`, `geometryScene(...)`, `vectorItem(...)`, and `complexItem(...)`. Existing slides are the best templates for controls like sliders, matrix presets, complex angle controls, and readouts.

### Presenting

Open `slides.html` through the Vite dev server. Use arrow keys, Page Up/Page Down, Space, Home, and End to navigate.

## Build

Install dependencies first:

```sh
npm install
```

Run the local development server:

```sh
npm run dev
```

Build for deployment at the root of a website:

```sh
npm run build
```

Build for deployment under another website path by passing Vite's `base` option:

```sh
npm run build -- --base=/your/path/
```

For example, if the deck will live at `https://example.com/math-viz/`, use:

```sh
npm run build -- --base=/math-viz/
```
