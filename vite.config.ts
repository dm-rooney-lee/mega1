import { defaultExclude, defineConfig } from "vitest/config";

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
  test: {
    // Native worktree tools (e.g. EnterWorktree) nest worktrees under .claude/worktrees/
    // inside the repo; without this, vitest run from the main checkout double-scans every
    // test file that also exists in an active worktree.
    exclude: [...defaultExclude, ".claude/**"],
  },
});
