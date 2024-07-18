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
        content: resolve(__dirname, "src/content.jsx"),
        "content-script": resolve(__dirname, "src/content-script-loader.js"),
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
