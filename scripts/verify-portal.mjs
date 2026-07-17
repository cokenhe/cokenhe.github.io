import { mkdtemp } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, webkit } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:4173/";
const screenshotDirectory = await mkdtemp("/tmp/cokenhe-portal-");

async function waitForPortalState(page, expectedWorld, expectedPhase, label) {
  const deadline = Date.now() + 30_000;
  let state;

  while (Date.now() < deadline) {
    state = await page.evaluate(() => ({
      world: document.querySelector('[data-od-id="portfolio-worlds"]')?.dataset.world,
      phase: document.querySelector('[data-od-id="new-world-layer"]')?.dataset.phase,
      destinationReady: document.querySelector('[data-od-id="new-world-frame"]')?.dataset.ready,
      documentHidden: document.hidden,
    }));

    if (state.world === expectedWorld && state.phase === expectedPhase) return state;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }

  throw new Error(`${label}: ${JSON.stringify(state)}`);
}

async function waitForScrollPosition(page, expectedScroll) {
  const deadline = Date.now() + 5_000;
  let scrollPosition = 0;

  while (Date.now() < deadline) {
    scrollPosition = await page.evaluate(() => window.scrollY);
    if (Math.abs(scrollPosition - expectedScroll) <= 2) return scrollPosition;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
  }

  return scrollPosition;
}

async function inspectPortalLayer(page) {
  return page.locator('[data-od-id="new-world-layer"]').evaluate((layer) => {
    const child = layer.querySelector("iframe")?.contentDocument;
    return {
      phase: layer.dataset.phase,
      clipPath: getComputedStyle(layer).clipPath,
      visibility: getComputedStyle(layer).visibility,
      childReady: child?.documentElement.classList.contains("is-ready") ?? false,
      childInteractive: child?.body?.dataset.portalInteractive,
      childInert: child?.body?.inert ?? null,
      animals: child?.querySelectorAll('[data-od-id="animal-picker"] button').length ?? 0,
      classicVisible: Boolean(document.querySelector('[data-od-id="classic-world"]')?.getClientRects().length),
    };
  });
}

async function waitForIntermediatePortalFrame(page, expectedPhase, endpointClip) {
  await page.waitForFunction(
    ({ phase, endpoint }) => {
      const layer = document.querySelector('[data-od-id="new-world-layer"]');
      if (layer?.dataset.phase !== phase) return false;
      const clipPath = getComputedStyle(layer).clipPath;
      return clipPath !== "none" && clipPath !== endpoint;
    },
    { phase: expectedPhase, endpoint: endpointClip },
    { polling: "raf", timeout: 10_000 },
  );
}

function requireIntermediateClip(state, endpointClip, label) {
  if (state.clipPath === "none" || state.clipPath === endpointClip) {
    throw new Error(`${label} clip is at an endpoint: ${state.clipPath}`);
  }
  if (/^circle\((?:0(?:px|%)?|150vmax)\b/.test(state.clipPath)) {
    throw new Error(`${label} clip is zero or full: ${state.clipPath}`);
  }
}

function requireLiveIntermediateState(state, expectedPhase, endpointClip, label) {
  if (state.phase !== expectedPhase || state.visibility !== "visible") {
    throw new Error(`${label} layer state is invalid: ${JSON.stringify(state)}`);
  }
  requireIntermediateClip(state, endpointClip, label);
  if (!state.childReady || state.animals !== 5 || !state.classicVisible) {
    throw new Error(`${label} did not preserve both live worlds: ${JSON.stringify(state)}`);
  }
}

async function collectVisibilityThroughPhase(page, expectedPhase) {
  return page.locator('[data-od-id="new-world-layer"]').evaluate((layer, phase) => (
    new Promise((resolvePromise, reject) => {
      const samples = [];
      const deadline = performance.now() + 5_000;
      const sample = () => {
        samples.push(getComputedStyle(layer).visibility);
        if (layer.dataset.phase === phase) return resolvePromise(samples);
        if (performance.now() > deadline) return reject(new Error(`Portal did not reach ${phase}`));
        requestAnimationFrame(sample);
      };
      sample();
    })
  ), expectedPhase);
}

async function verifyReadinessHandshake(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let releaseNewWorld;
  const newWorldGate = new Promise((resolvePromise) => {
    releaseNewWorld = resolvePromise;
  });

  try {
    await page.route("**/new-world/index.html", async (route) => {
      await newWorldGate;
      await route.continue();
    });
    await page.goto(url, { waitUntil: "commit" });
    await page.waitForFunction(() => document.documentElement.dataset.portfolioWorld === "classic");

    const button = page.locator('nav [data-od-id="magic-portal-toggle"]');
    await button.waitFor();
    if (await button.isEnabled()) {
      throw new Error("The nocturnal portal is enabled before the child readiness handshake.");
    }
    await button.evaluate((node) => node.click());
    await page.waitForTimeout(900);
    if ((await page.locator('[data-od-id="portfolio-worlds"]').getAttribute("data-world")) !== "classic") {
      throw new Error("An early click left the classic world before the child readiness handshake.");
    }

    releaseNewWorld();
    await page.waitForFunction(() => {
      const frame = document.querySelector('[data-od-id="new-world-frame"]');
      return frame?.dataset.ready === "true"
        && frame.contentDocument?.body?.dataset.portalInteractive === "false";
    });
    if (!(await button.isEnabled())) {
      throw new Error("The nocturnal portal did not enable after the child readiness handshake.");
    }
  } finally {
    releaseNewWorld?.();
    await page.close();
  }
}

async function verifyDetailedChromiumFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const browserErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const frame = document.querySelector('[data-od-id="new-world-frame"]');
      return frame?.dataset.ready === "true"
        && frame.contentDocument?.body?.dataset.portalInteractive === "false";
    });

    const classicHeading = page.getByRole("heading", {
      name: "Full stack developer for operational SaaS.",
    });
    const classicButton = page.locator('nav [data-od-id="magic-portal-toggle"]');
    await classicHeading.waitFor();
    if ((await classicButton.count()) !== 1) {
      throw new Error("The classic navigation does not contain exactly one magic portal button.");
    }

    const buttonBefore = await classicButton.evaluate((node) => ({
      width: node.offsetWidth,
      height: node.offsetHeight,
    }));
    const peek = classicButton.locator(".magic-portal-button__peek");
    const hiddenOpacity = await peek.evaluate((node) => getComputedStyle(node).opacity);
    await classicButton.hover();
    await page.waitForTimeout(450);
    const shownOpacity = await peek.evaluate((node) => getComputedStyle(node).opacity);
    const buttonAfter = await classicButton.evaluate((node) => ({
      width: node.offsetWidth,
      height: node.offsetHeight,
    }));
    const irisTransforms = await peek.locator(".magic-portal-button__peek-iris").evaluateAll(
      (nodes) => nodes.map((node) => getComputedStyle(node).transform),
    );
    if (hiddenOpacity !== "0" || shownOpacity !== "1") {
      throw new Error(`Unexpected dog peek opacity: ${hiddenOpacity} -> ${shownOpacity}`);
    }
    if (JSON.stringify(buttonAfter) !== JSON.stringify(buttonBefore)) {
      throw new Error("The dog peek changed the magic button geometry.");
    }
    if (irisTransforms.some((transform) => transform === "none")) {
      throw new Error("The dog irises are not aimed toward the button.");
    }

    const sparkleAnimation = await classicButton
      .locator(".magic-portal-button__spark--one")
      .evaluate((node) => getComputedStyle(node).animationName);
    if (!sparkleAnimation.includes("magic-spark")) {
      throw new Error(`Magic button sparkle is not animated (${sparkleAnimation}).`);
    }

    await page.screenshot({
      path: resolve(screenshotDirectory, "portal-classic-1440.png"),
      fullPage: false,
    });

    const closedState = await inspectPortalLayer(page);
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
    await page.waitForTimeout(100);
    const classicScrollPosition = await page.evaluate(() => window.scrollY);
    await classicButton.evaluate((node) => {
      node.focus({ preventScroll: true });
      node.click();
    });
    await waitForIntermediatePortalFrame(page, "opening", closedState.clipPath);

    const openingState = await inspectPortalLayer(page);
    requireLiveIntermediateState(openingState, "opening", closedState.clipPath, "Opening");
    if (openingState.childInteractive !== "false" || openingState.childInert !== true) {
      throw new Error(`The child became interactive before opening completed: ${JSON.stringify(openingState)}`);
    }
    const portalAnimation = await page.locator('[data-od-id="portal-transition"] .portal-transition__disc')
      .evaluate((node) => getComputedStyle(node).animationName);
    if (!portalAnimation.includes("portal-rim-open")) {
      throw new Error(`The centered portal is missing its opening animation (${portalAnimation}).`);
    }
    await page.screenshot({
      path: resolve(screenshotDirectory, "portal-opening-1440.png"),
      fullPage: false,
      animations: "allow",
    });

    const openingVisibility = await collectVisibilityThroughPhase(page, "nocturnal-idle");
    if (openingVisibility.some((visibility) => visibility !== "visible")) {
      throw new Error(`The live destination was hidden at opening completion: ${openingVisibility.join(", ")}`);
    }
    await waitForPortalState(page, "nocturnal", "nocturnal-idle", "Portal entry did not settle");
    await page.waitForFunction(() => {
      const body = document.querySelector('[data-od-id="new-world-frame"]')?.contentDocument?.body;
      return body?.dataset.portalInteractive === "true" && body.inert === false;
    });

    const nocturnalButton = page.locator('[data-od-id="nocturnal-portal-control"] button');
    await nocturnalButton.waitFor();
    if (!(await nocturnalButton.evaluate((node) => document.activeElement === node))) {
      throw new Error("Keyboard focus was not handed to the nocturnal return control after entry.");
    }
    const fullState = await inspectPortalLayer(page);
    if (fullState.visibility !== "visible" || fullState.childInteractive !== "true" || fullState.childInert !== false) {
      throw new Error(`The completed destination is not visibly interactive: ${JSON.stringify(fullState)}`);
    }

    const nocturnalState = await page.locator('[data-od-id="new-world-frame"]').evaluate((frame) => {
      const child = frame.contentDocument;
      const liquid = child?.querySelector('[data-od-id="liquid-glass-background"]')?.contentDocument;
      return {
        title: child?.title,
        animals: child?.querySelectorAll('[data-od-id="animal-picker"] button').length ?? 0,
        canvas: Boolean(liquid?.querySelector(".experience__smoke canvas")),
        interactive: child?.body?.dataset.portalInteractive,
      };
    });
    if (nocturnalState.title !== "Ken He — Full Stack Software Developer" || nocturnalState.animals !== 5
      || !nocturnalState.canvas || nocturnalState.interactive !== "true") {
      throw new Error(`Chromium did not preserve the interactive animal portfolio: ${JSON.stringify(nocturnalState)}`);
    }

    await nocturnalButton.click();
    await waitForIntermediatePortalFrame(page, "closing", fullState.clipPath);
    const closingState = await inspectPortalLayer(page);
    requireLiveIntermediateState(closingState, "closing", fullState.clipPath, "Closing");
    if (closingState.childInteractive !== "false" || closingState.childInert !== true) {
      throw new Error(`The child remained interactive while closing: ${JSON.stringify(closingState)}`);
    }
    await page.screenshot({
      path: resolve(screenshotDirectory, "portal-closing-1440.png"),
      fullPage: false,
      animations: "allow",
    });
    await waitForPortalState(page, "classic", "classic-idle", "Portal return did not settle");
    await page.waitForFunction(() => {
      const body = document.querySelector('[data-od-id="new-world-frame"]')?.contentDocument?.body;
      return body?.dataset.portalInteractive === "false" && body.inert === true;
    });

    const returnedClassicButton = page.locator('nav [data-od-id="magic-portal-toggle"]');
    if (!(await returnedClassicButton.evaluate((node) => document.activeElement === node))) {
      throw new Error("Keyboard focus was not restored to the classic magic button after return.");
    }
    const restoredScrollPosition = await waitForScrollPosition(page, classicScrollPosition);
    if (Math.abs(restoredScrollPosition - classicScrollPosition) > 2) {
      throw new Error(`Classic scroll changed from ${classicScrollPosition}px to ${restoredScrollPosition}px.`);
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

    return {
      browserErrors: browserErrors.length,
      focusHandoff: true,
      irisTransforms,
      nocturnalState,
      openingState,
      closingState,
      portalAnimation,
      responsiveState,
      scrollRestored: restoredScrollPosition,
      sparkleAnimation,
    };
  } finally {
    await page.close();
  }
}

async function verifyReducedMotion(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => (
      document.querySelector('[data-od-id="new-world-frame"]')?.dataset.ready === "true"
    ));
    await page.locator('nav [data-od-id="magic-portal-toggle"]').click();
    const reducedDuration = await page.locator('[data-od-id="new-world-layer"]').evaluate(
      (layer) => getComputedStyle(layer).animationDuration,
    );
    if (reducedDuration !== "0.12s") {
      throw new Error(`Reduced portal duration is ${reducedDuration}, expected 0.12s.`);
    }
    await waitForPortalState(page, "nocturnal", "nocturnal-idle", "Reduced-motion entry did not settle");
    await page.locator('[data-od-id="nocturnal-portal-control"] button').click();
    await waitForPortalState(page, "classic", "classic-idle", "Reduced-motion return did not settle");
    return reducedDuration;
  } finally {
    await page.close();
  }
}

async function verifyEngine(browserType, engineName, checkCanvas) {
  const browser = await browserType.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => (
      document.querySelector('[data-od-id="new-world-frame"]')?.dataset.ready === "true"
    ));
    await page.locator('nav [data-od-id="magic-portal-toggle"]').click();
    await waitForPortalState(page, "nocturnal", "nocturnal-idle", `${engineName} entry did not settle`);
    const preserved = await page.locator('[data-od-id="new-world-frame"]').evaluate((frame) => {
      const child = frame.contentDocument;
      const liquid = child?.querySelector('[data-od-id="liquid-glass-background"]')?.contentDocument;
      return {
        title: child?.title,
        animals: child?.querySelectorAll('[data-od-id="animal-picker"] button').length ?? 0,
        canvas: Boolean(liquid?.querySelector(".experience__smoke canvas")),
        interactive: child?.body?.dataset.portalInteractive,
      };
    });
    if (preserved.title !== "Ken He — Full Stack Software Developer" || preserved.animals !== 5) {
      throw new Error(`${engineName} did not preserve the animal portfolio: ${JSON.stringify(preserved)}`);
    }
    if (preserved.interactive !== "true" || (checkCanvas && !preserved.canvas)) {
      throw new Error(`${engineName} did not activate the destination correctly: ${JSON.stringify(preserved)}`);
    }
    await page.locator('[data-od-id="nocturnal-portal-control"] button').click();
    await waitForPortalState(page, "classic", "classic-idle", `${engineName} return did not settle`);
    return preserved;
  } finally {
    await page.close();
    await browser.close();
  }
}

const chromiumBrowser = await chromium.launch();
let detailed;
let reducedDuration;
try {
  await verifyReadinessHandshake(chromiumBrowser);
  detailed = await verifyDetailedChromiumFlow(chromiumBrowser);
  reducedDuration = await verifyReducedMotion(chromiumBrowser);
} finally {
  await chromiumBrowser.close();
}

const chromiumSmoke = await verifyEngine(chromium, "Chromium", true);
const webkitSmoke = await verifyEngine(webkit, "WebKit", false);

console.log(JSON.stringify({
  status: "pass",
  url,
  screenshotDirectory,
  readinessHandshake: true,
  reducedDuration,
  engines: {
    Chromium: chromiumSmoke,
    WebKit: webkitSmoke,
  },
  detailed,
}, null, 2));
