import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, "public/background.js"),
        popup: resolve(__dirname, "src/popup.jsx"),
        content: resolve(__dirname, "public/content.js"),
        index: resolve(__dirname, "src/main.jsx"),
      },
      output: {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]",
        dir: resolve(__dirname, "dist"),
      },
    },
  },
  test: {
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "node_modules/**",
        "**/*.spec.{js,jsx}",
        "**/*.test.{js,jsx}",
        "src/main.jsx",
        "src/popup.jsx",
        "src/atoms/atoms.js",
      ],
    },
    environment: "jsdom",
    globals: true,
    setupFiles: [resolve(__dirname, "./src/setupTests.js")],
  },
});
