import { chromium } from "playwright";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const url = process.argv[2] ?? "http://127.0.0.1:8125/";
const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const screenshotDirectory = resolve(projectDirectory, "../RECON/cokenhe-redesign/screenshots");
const browser = await chromium.launch();

async function waitForPortalState(page, expectedWorld, expectedTransition, label) {
  const deadline = Date.now() + 30_000;
  let state;

  while (Date.now() < deadline) {
    state = await page.evaluate(() => ({
      world: document.querySelector('[data-od-id="portfolio-worlds"]')?.dataset.world,
      transition: document.querySelector('[data-od-id="portal-transition"]')?.dataset.state,
      destinationReady: document.querySelector('[data-od-id="new-world-frame"]')?.dataset.ready,
      documentHidden: document.hidden,
    }));

    if (state.world === expectedWorld && state.transition === expectedTransition) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`${label}: ${JSON.stringify(state)}`);
}

async function waitForScrollPosition(page, expectedScroll) {
  const deadline = Date.now() + 5_000;
  let scrollPosition = 0;

  while (Date.now() < deadline) {
    scrollPosition = await page.evaluate(() => window.scrollY);
    if (Math.abs(scrollPosition - expectedScroll) <= 2) return scrollPosition;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return scrollPosition;
}

const readinessPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
let releaseNewWorld;
const newWorldGate = new Promise((resolve) => {
  releaseNewWorld = resolve;
});

await readinessPage.route("**/new-world/index.html", async (route) => {
  await newWorldGate;
  await route.continue();
});
await readinessPage.goto(url, { waitUntil: "commit" });
await readinessPage.waitForFunction(() => document.documentElement.dataset.portfolioWorld === "classic");

const preparingButton = readinessPage.locator('nav [data-od-id="magic-portal-toggle"]');
await preparingButton.waitFor();
if (await preparingButton.isEnabled()) {
  throw new Error("The nocturnal portal is enabled before its destination iframe is ready.");
}
await preparingButton.evaluate((node) => node.click());
await readinessPage.waitForTimeout(1500);
if ((await readinessPage.locator('[data-od-id="portfolio-worlds"]').getAttribute("data-world")) !== "classic") {
  throw new Error("An early click left the classic world before the nocturnal iframe was ready.");
}

releaseNewWorld();
await readinessPage.waitForFunction(() => document.querySelector('[data-od-id="new-world-frame"]')?.dataset.ready === "true");
if (!(await preparingButton.isEnabled())) {
  throw new Error("The nocturnal portal did not enable after its destination iframe loaded.");
}
await readinessPage.close();

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const browserErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(message.text());
});
page.on("pageerror", (error) => browserErrors.push(error.message));

await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.documentElement.dataset.portfolioWorld === "classic");

const classicHeading = page.getByRole("heading", {
  name: "Full stack developer for operational SaaS.",
});
await classicHeading.waitFor();

const classicButton = page.locator('nav [data-od-id="magic-portal-toggle"]');
if ((await classicButton.count()) !== 1) {
  throw new Error("The classic navigation does not contain exactly one magic portal button.");
}

await page.waitForTimeout(850);
await page.screenshot({
  path: resolve(screenshotDirectory, "portal-classic-1440.png"),
  fullPage: false,
});

const sparkleAnimation = await classicButton
  .locator(".magic-portal-button__spark--one")
  .evaluate((node) => getComputedStyle(node).animationName);
if (!sparkleAnimation.includes("magic-spark")) {
  throw new Error(`Magic button sparkle is not animated (${sparkleAnimation}).`);
}

await page.waitForFunction(() => document.querySelector('[data-od-id="new-world-frame"]')?.dataset.ready === "true");
await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
await page.waitForTimeout(100);
const classicScrollPosition = await page.evaluate(() => window.scrollY);
await classicButton.evaluate((node) => {
  node.focus({ preventScroll: true });
  node.click();
});

const transition = page.locator('[data-od-id="portal-transition"]');
if ((await transition.getAttribute("data-state")) !== "active") {
  throw new Error("The portal transition did not activate after clicking the magic button.");
}

const portalAnimation = await transition
  .locator(".portal-transition__disc")
  .evaluate((node) => getComputedStyle(node).animationName);
if (!portalAnimation.includes("portal-shake-expand")) {
  throw new Error(`The centered portal is missing its shake-and-expand animation (${portalAnimation}).`);
}

await waitForPortalState(page, "nocturnal", "idle", "Portal entry did not settle");

const nocturnalButton = page.locator('[data-od-id="nocturnal-portal-control"] [data-od-id="magic-portal-toggle"]');
await nocturnalButton.waitFor();
if (!(await nocturnalButton.evaluate((node) => document.activeElement === node))) {
  throw new Error("Keyboard focus was not handed to the nocturnal return control after entry.");
}

const nocturnalState = await page.locator('[data-od-id="new-world-frame"]').evaluate((frame) => {
  const frameDocument = frame.contentDocument;
  const liquidFrame = frameDocument?.querySelector('[data-od-id="liquid-glass-background"]');
  const liquidDocument = liquidFrame?.contentDocument;
  const canvas = liquidDocument?.querySelector(".experience__smoke canvas");

  return {
    active: frame.classList.contains("is-active"),
    title: frameDocument?.title,
    animalOptions: frameDocument?.querySelectorAll('[data-od-id="animal-picker"] button').length ?? 0,
    liquidCanvas: Boolean(canvas),
    sourceReady: frameDocument?.documentElement.classList.contains("is-ready") ?? false,
  };
});

if (!nocturnalState.active) throw new Error("The nocturnal iframe is not active after the portal swap.");
if (nocturnalState.title !== "Ken He — Full Stack Software Developer") {
  throw new Error(`Unexpected nocturnal world title: ${nocturnalState.title}`);
}
if (nocturnalState.animalOptions !== 5) {
  throw new Error(`Expected five preserved animal choices, found ${nocturnalState.animalOptions}.`);
}
if (!nocturnalState.sourceReady || !nocturnalState.liquidCanvas) {
  throw new Error("The preserved nocturnal interactions or WebGL background did not initialize.");
}

await nocturnalButton.click();
await waitForPortalState(page, "classic", "idle", "Portal return did not settle");
await classicHeading.waitFor();
const returnedClassicButton = page.locator('nav [data-od-id="magic-portal-toggle"]');
if (!(await returnedClassicButton.evaluate((node) => document.activeElement === node))) {
  throw new Error("Keyboard focus was not restored to the classic magic button after return.");
}
const restoredScrollPosition = await waitForScrollPosition(page, classicScrollPosition);
if (Math.abs(restoredScrollPosition - classicScrollPosition) > 2) {
  throw new Error(`Classic scroll position changed from ${classicScrollPosition}px to ${restoredScrollPosition}px after return.`);
}

await page.setViewportSize({ width: 390, height: 844 });
const responsiveState = await page.evaluate(() => ({
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  buttonVisible: Boolean(document.querySelector('nav [data-od-id="magic-portal-toggle"]')?.getClientRects().length),
}));

if (responsiveState.overflow > 1) {
  throw new Error(`The classic world overflows horizontally by ${responsiveState.overflow}px at 390px.`);
}
if (!responsiveState.buttonVisible) {
  throw new Error("The magic portal button is not visible in the mobile navigation.");
}
if (browserErrors.length) {
  throw new Error(`Browser errors: ${browserErrors.join(" | ")}`);
}

await page.close();

const transitionCapturePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await transitionCapturePage.route("**/new-world/index.html", (route) => route.fulfill({
  contentType: "text/html",
  body: "<!doctype html><html><body></body></html>",
}));
await transitionCapturePage.goto(url, { waitUntil: "domcontentloaded" });
await transitionCapturePage.waitForFunction(() => document.querySelector('[data-od-id="new-world-frame"]')?.dataset.ready === "true");
const transitionCaptureButton = transitionCapturePage.locator('nav [data-od-id="magic-portal-toggle"]');
await transitionCaptureButton.click();
await transitionCapturePage.waitForFunction(() => document.querySelector('[data-od-id="portal-transition"]')?.dataset.state === "active");
await transitionCapturePage.waitForTimeout(420);
await transitionCapturePage.screenshot({
  path: resolve(screenshotDirectory, "portal-transition-1440.png"),
  fullPage: false,
  animations: "allow",
});
await transitionCapturePage.close();

await browser.close();

console.log(JSON.stringify({
  status: "pass",
  worlds: ["classic", "nocturnal"],
  portalAnimation,
  sparkleAnimation,
  nocturnalState,
  responsiveState,
  readinessGate: true,
  focusHandoff: true,
  scrollRestored: restoredScrollPosition,
  browserErrors: 0,
}, null, 2));
