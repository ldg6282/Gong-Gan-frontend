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
        "content-script": resolve(__dirname, "src/content-script.jsx"),
      },
      output: {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "assets/[name].[ext]",
        dir: resolve(__dirname, "dist"),
      },
    },
  },
});
