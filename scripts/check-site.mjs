import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "package.json",
  "vite.config.js",
  "src/App.jsx",
  "src/styles.css",
  "index.html",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing ${file}`);
}

const app = readFileSync("src/App.jsx", "utf8");
const styles = readFileSync("src/styles.css", "utf8");
const index = readFileSync("index.html", "utf8");

const requiredText = [
  "framer-motion",
  "Built internal admin and customer-facing portals from the ground up",
  "Designed and implemented an Express.js API gateway",
  "Served as the primary technical owner",
  "Developed native iOS/Android and React Native features",
  "Optimized client-side caching and data loading",
  "WonderKin Ltd.",
  "AppQuick.co",
  "HKIE GED",
  "Spearheaded a React Native migration",
  "Created a user-friendly mobile application with Flutter",
  "Crafted bespoke mobile applications for prominent enterprises",
  "useScroll",
  "useTransform",
  "/assets/1-f96675d8.webp",
  "/assets/1-c5138d7f.webp",
  "/assets/2-b5e6e141.webp",
];

for (const text of requiredText) {
  if (!app.includes(text)) throw new Error(`Missing source text: ${text}`);
}

if (!index.includes('type="module"')) {
  throw new Error("Built index is missing the module script");
}

if (styles.includes("body,\nbutton,\ninput")) {
  throw new Error("Body font reset would override the site font");
}

for (const removed of [
  "Download resume",
  "Complete resume experience",
  "Ken-He-Resume-Full-Stack.pdf",
  "(437) 443-9369",
  "tel:+14374439369",
]) {
  if (app.includes(removed) || index.includes(removed)) {
    throw new Error(`Removed content is still present: ${removed}`);
  }
}

const localRefs = [...index.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((ref) => !ref.includes(":") && !ref.startsWith("#"))
  .map((ref) => ref.replace(/^\.?\//, ""));

for (const ref of localRefs) {
  if (!existsSync(ref)) throw new Error(`Missing local reference: ${ref}`);
}
