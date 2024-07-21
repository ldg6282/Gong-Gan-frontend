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
});
