import { defineConfig } from "vite";

export default defineConfig({
  base: "/math-viz/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        slides: "slides.html",
      },
    },
  },
});
