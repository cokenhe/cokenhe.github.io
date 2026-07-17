import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const isOpenDesignBuild = process.env.OPEN_DESIGN_BUILD === "1";

export default defineConfig({
  root: "src",
  base: "./",
  publicDir: "public",
  plugins: [react()],
  css: {
    postcss: { plugins: [] },
  },
  build: {
    outDir: isOpenDesignBuild ? "../dist-open-design" : "../dist-site",
    emptyOutDir: true,
    assetsDir: isOpenDesignBuild ? "react-assets" : "assets",
  },
});
