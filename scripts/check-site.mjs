import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT_ABSOLUTE_RUNTIME_ASSET = /(["'`])\/assets\/[^"'`]+\.(?:avif|gif|jpe?g|png|svg|webp)\1/g;

function findCssBlock(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return null;

  const openIndex = source.indexOf("{", markerIndex + marker.length);
  if (openIndex === -1) return null;

  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] !== "}") continue;
    depth -= 1;
    if (depth === 0) {
      return {
        end: index + 1,
        source: source.slice(markerIndex, index + 1),
        start: markerIndex,
      };
    }
  }

  return null;
}

function listJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) return listJavaScriptFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".js") ? [entryPath] : [];
  });
}

const requiredFiles = [
  "package.json",
  "vite.config.js",
  "src/App.jsx",
  "src/components/MagicPortalButton.jsx",
  "src/components/PortalTransition.jsx",
  "src/portal-state.mjs",
  "src/styles.css",
  "src/public/new-world/index.html",
  "src/public/new-world/portal-bridge.mjs",
  "src/public/new-world/wild-gaze-clone-v1.html",
  "src/public/new-world/clone-assets/site.js",
  "src/public/new-world/clone-assets/animals/dog.png",
  "src/public/new-world/portfolio-assets/images/cokenhe.github.io/1-f96675d8-5c72aec127.webp",
  "src/public/assets/1-f96675d8.webp",
  "src/public/coding.png",
  "scripts/deploy-site.mjs",
  "scripts/deploy-open-design.mjs",
  "index.html",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing ${file}`);
}

const app = readFileSync("src/App.jsx", "utf8");
const styles = readFileSync("src/styles.css", "utf8");
const index = readFileSync("index.html", "utf8");
const magicButton = readFileSync("src/components/MagicPortalButton.jsx", "utf8");
const portalTransition = readFileSync("src/components/PortalTransition.jsx", "utf8");
const portalState = readFileSync("src/portal-state.mjs", "utf8");

const rootAbsoluteSourceAsset = app.match(ROOT_ABSOLUTE_RUNTIME_ASSET)?.[0];
if (rootAbsoluteSourceAsset) {
  throw new Error(`Root-absolute runtime asset bypasses Vite BASE_URL: ${rootAbsoluteSourceAsset}`);
}

const finePointerMedia = "@media (hover: hover) and (pointer: fine)";
const finePointerBlock = findCssBlock(styles, finePointerMedia);
if (!finePointerBlock) {
  throw new Error(`Missing exact portal hover capability query: ${finePointerMedia}`);
}

for (const selector of [
  ".magic-portal-button:hover:not(:disabled)",
  ".magic-portal-button--classic:hover:not(:disabled) .magic-portal-button__peek",
]) {
  if (!finePointerBlock.source.includes(selector)) {
    throw new Error(`Portal hover selector is not fine-pointer gated: ${selector}`);
  }
}

const stylesOutsideFinePointerBlock = styles.slice(0, finePointerBlock.start)
  + styles.slice(finePointerBlock.end);
if (/\.magic-portal-button[^,{]*:hover/.test(stylesOutsideFinePointerBlock)) {
  throw new Error("Portal hover behavior exists outside the fine-pointer capability query");
}

if (!stylesOutsideFinePointerBlock.includes(
  ".magic-portal-button--classic:focus-visible .magic-portal-button__peek",
)) {
  throw new Error("Keyboard dog reveal must remain separate from the pointer capability query");
}

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
  "1-f96675d8.webp",
  "1-c5138d7f.webp",
  "2-b5e6e141.webp",
  "import.meta.env.BASE_URL",
];

for (const text of requiredText) {
  if (!app.includes(text)) throw new Error(`Missing source text: ${text}`);
}

for (const [source, markers] of [
  [app, [
    "ClassicPortfolio",
    "new-world/index.html",
    "data-world={world}",
    "PORTAL_PHASE",
    "onAnimationEnd={handlePortalAnimationEnd}",
    "ken-portfolio-portal",
    "newWorldReadyGeneration",
    "event.animationName !== expectedAnimationName",
    "portal-world-open-reduced",
    "portal-world-close-reduced",
  ]],
  [magicButton, [
    "magic-portal-button__spark",
    "data-world-target",
    "getPortalButtonCopy",
    "magic-portal-button__peek",
    "new-world/clone-assets/animals/dog.png",
    "aria-hidden=\"true\"",
  ]],
  [portalTransition, [
    "portal-transition__disc",
    "data-state",
    "phase",
  ]],
  [portalState, ["Enter the nocturnal portfolio", "Return to the classic portfolio", "REDUCED_TIMING"]],
  [styles, [
    "@keyframes portal-world-open",
    "@keyframes portal-world-close",
    "@keyframes portal-rim-open-reduced",
    "@keyframes portal-rim-close-reduced",
    "clip-path: circle(150vmax",
    "@keyframes magic-spark",
    "prefers-reduced-motion",
    ".magic-portal-button__peek-eye",
    finePointerMedia,
    ".magic-portal-button--classic:focus-visible .magic-portal-button__peek",
  ]],
]) {
  for (const marker of markers) {
    if (!source.includes(marker)) throw new Error(`Missing portal marker: ${marker}`);
  }
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

const buildDirectoryFlag = process.argv.indexOf("--build-dir");
if (buildDirectoryFlag !== -1) {
  const buildDirectoryArgument = process.argv[buildDirectoryFlag + 1];
  if (!buildDirectoryArgument) throw new Error("--build-dir requires a directory path");

  const buildDirectory = resolve(buildDirectoryArgument);
  if (!existsSync(buildDirectory)) throw new Error(`Missing build directory: ${buildDirectory}`);

  const builtJavaScriptFiles = listJavaScriptFiles(buildDirectory);
  if (!builtJavaScriptFiles.length) {
    throw new Error(`Build directory contains no JavaScript bundles: ${buildDirectory}`);
  }

  for (const builtFile of builtJavaScriptFiles) {
    const builtSource = readFileSync(builtFile, "utf8");
    const rootAbsoluteBuiltAsset = builtSource.match(ROOT_ABSOLUTE_RUNTIME_ASSET)?.[0];
    if (rootAbsoluteBuiltAsset) {
      throw new Error(
        `Built bundle retains a root-absolute runtime asset (${builtFile}): ${rootAbsoluteBuiltAsset}`,
      );
    }
  }
}
