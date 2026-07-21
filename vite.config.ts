import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: "es2022",
    // Phaser is large; a slightly higher warning limit keeps the build output clean.
    chunkSizeWarningLimit: 1500,
  },
});
