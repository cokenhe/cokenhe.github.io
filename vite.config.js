import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  root: "src",
  base: "./",
  publicDir: "public",
  plugins: [react()],
  css: {
    postcss: { plugins: [] },
  },
  build: {
    outDir: "../dist-site",
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
