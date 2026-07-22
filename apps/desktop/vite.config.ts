import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.join(__dirname, "src/renderer"),
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: path.join(__dirname, "out/renderer"),
    emptyOutDir: true,
  },
});
