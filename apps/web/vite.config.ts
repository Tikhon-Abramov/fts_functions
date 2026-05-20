import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ command }) => ({
  base: "/",
  plugins: [
    react(),
    // Bundle visualizer is build-only; it emits dist/stats.html alongside the build.
    // Ignored in `vite dev`.
    ...(command === "build"
      ? [
          visualizer({
            filename: "dist/stats.html",
            template: "treemap",
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  appType: "spa",
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 8787,
    strictPort: true,
  },
}));
