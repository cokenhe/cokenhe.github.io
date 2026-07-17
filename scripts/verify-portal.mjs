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
      opacity: getComputedStyle(layer).opacity,
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
  const stateHandle = await page.waitForFunction(
    ({ phase, endpoint }) => {
      const layer = document.querySelector('[data-od-id="new-world-layer"]');
      if (layer?.dataset.phase !== phase) return false;
      const clipPath = getComputedStyle(layer).clipPath;
      if (clipPath === "none" || clipPath === endpoint) return false;
      const child = layer.querySelector("iframe")?.contentDocument;
      const rim = document.querySelector('[data-od-id="portal-transition"] .portal-transition__disc');
      return {
        phase: layer.dataset.phase,
        clipPath,
        visibility: getComputedStyle(layer).visibility,
        childReady: child?.documentElement.classList.contains("is-ready") ?? false,
        childInteractive: child?.body?.dataset.portalInteractive,
        childInert: child?.body?.inert ?? null,
        animals: child?.querySelectorAll('[data-od-id="animal-picker"] button').length ?? 0,
        classicVisible: Boolean(document.querySelector('[data-od-id="classic-world"]')?.getClientRects().length),
        portalAnimation: rim ? getComputedStyle(rim).animationName : null,
      };
    },
    { phase: expectedPhase, endpoint: endpointClip },
    { polling: "raf", timeout: 10_000 },
  );

  try {
    return await stateHandle.jsonValue();
  } finally {
    await stateHandle.dispose();
  }
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

async function startPortalVisibilityTrace(page, transitionPhase, finalPhase) {
  await page.evaluate(({ transition, final }) => {
    const layer = document.querySelector('[data-od-id="new-world-layer"]');
    const trace = {
      transitionPhase: transition,
      finalPhase: final,
      started: false,
      done: false,
      samples: [],
    };
    window.__portalVisibilityTrace = trace;

    const sample = () => {
      const phase = layer?.dataset.phase;
      trace.samples.push({
        time: performance.now(),
        phase,
        clipPath: layer ? getComputedStyle(layer).clipPath : null,
        visibility: layer ? getComputedStyle(layer).visibility : null,
        classicVisible: Boolean(document.querySelector('[data-od-id="classic-world"]')?.getClientRects().length),
      });
      if (phase === transition) trace.started = true;
      if (trace.started && phase === final) {
        trace.done = true;
        return;
      }
      requestAnimationFrame(sample);
    };

    sample();
  }, { transition: transitionPhase, final: finalPhase });
}

async function finishPortalVisibilityTrace(page) {
  await page.waitForFunction(
    () => window.__portalVisibilityTrace?.done === true,
    null,
    { polling: "raf", timeout: 10_000 },
  );
  return page.evaluate(() => {
    const trace = window.__portalVisibilityTrace;
    delete window.__portalVisibilityTrace;
    return trace;
  });
}

function requirePortalVisibilityTrace(trace, initialPhase, transitionPhase, finalPhase, finalClip, label) {
  const phases = [initialPhase, transitionPhase, finalPhase];
  const samples = trace?.samples ?? [];
  if (!trace?.started || !trace.done || samples.length < 3 || samples[0]?.phase !== initialPhase) {
    throw new Error(`${label} visibility trace did not span the full transition: ${JSON.stringify(trace)}`);
  }

  let phaseIndex = 0;
  for (const sample of samples) {
    const nextIndex = phases.indexOf(sample.phase);
    if (nextIndex < phaseIndex || nextIndex === -1) {
      throw new Error(`${label} visibility trace changed phase out of order: ${JSON.stringify(samples)}`);
    }
    phaseIndex = nextIndex;
    if (sample.visibility !== "visible" || !sample.classicVisible) {
      throw new Error(`${label} hid or swapped a live world: ${JSON.stringify(sample)}`);
    }
  }

  const transitionSamples = samples.filter((sample) => sample.phase === transitionPhase);
  const finalSample = samples.at(-1);
  if (!transitionSamples.length || finalSample.phase !== finalPhase || finalSample.clipPath !== finalClip) {
    throw new Error(`${label} did not finish on the expected clipped frame: ${JSON.stringify(finalSample)}`);
  }

  return {
    sampleCount: samples.length,
    transitionSampleCount: transitionSamples.length,
    phases: [...new Set(samples.map((sample) => sample.phase))],
    first: samples[0],
    final: finalSample,
  };
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
    const gazeMeasurements = await classicButton.evaluate((button) => {
      const buttonRect = button.getBoundingClientRect();
      const buttonCenter = {
        x: buttonRect.left + buttonRect.width / 2,
        y: buttonRect.top + buttonRect.height / 2,
      };
      const round = (value) => Math.round(value * 10_000) / 10_000;

      return [...button.querySelectorAll(".magic-portal-button__peek-iris")].map((iris) => {
        const eye = iris.closest(".magic-portal-button__peek-eye");
        const side = eye?.classList.contains("magic-portal-button__peek-eye--left") ? "left" : "right";
        const eyeRect = eye.getBoundingClientRect();
        const irisRect = iris.getBoundingClientRect();
        const eyeCenter = {
          x: eyeRect.left + eyeRect.width / 2,
          y: eyeRect.top + eyeRect.height / 2,
        };
        const irisCenter = {
          x: irisRect.left + irisRect.width / 2,
          y: irisRect.top + irisRect.height / 2,
        };
        const displacement = {
          x: irisCenter.x - eyeCenter.x,
          y: irisCenter.y - eyeCenter.y,
        };
        const target = {
          x: buttonCenter.x - eyeCenter.x,
          y: buttonCenter.y - eyeCenter.y,
        };
        const displacementLength = Math.hypot(displacement.x, displacement.y);
        const targetLength = Math.hypot(target.x, target.y);
        const transform = getComputedStyle(iris).transform;
        const matrix = new DOMMatrixReadOnly(transform);

        return {
          side,
          transform,
          matrixTranslation: { x: round(matrix.m41), y: round(matrix.m42) },
          displacement: { x: round(displacement.x), y: round(displacement.y) },
          target: { x: round(target.x), y: round(target.y) },
          inward: round(side === "left" ? displacement.x : -displacement.x),
          downward: round(displacement.y),
          alignment: round(
            (displacement.x * target.x + displacement.y * target.y)
              / (displacementLength * targetLength),
          ),
        };
      });
    });
    const irisTransforms = gazeMeasurements.map((measurement) => measurement.transform);
    if (hiddenOpacity !== "0" || shownOpacity !== "1") {
      throw new Error(`Unexpected dog peek opacity: ${hiddenOpacity} -> ${shownOpacity}`);
    }
    if (JSON.stringify(buttonAfter) !== JSON.stringify(buttonBefore)) {
      throw new Error("The dog peek changed the magic button geometry.");
    }
    if (gazeMeasurements.length !== 2 || gazeMeasurements.some((measurement) => (
      measurement.transform === "none"
      || !Number.isFinite(measurement.matrixTranslation.x)
      || !Number.isFinite(measurement.matrixTranslation.y)
      || measurement.inward <= 0.5
      || measurement.downward <= 0.5
      || measurement.alignment <= 0.75
      || (measurement.side === "left" ? measurement.target.x <= 0 : measurement.target.x >= 0)
      || measurement.target.y <= 0
    ))) {
      throw new Error(`The dog irises are not aimed inward and down toward the button: ${JSON.stringify(gazeMeasurements)}`);
    }

    await page.mouse.move(0, 0);
    await page.waitForFunction(
      () => getComputedStyle(
        document.querySelector('nav [data-od-id="magic-portal-toggle"] .magic-portal-button__peek'),
      ).opacity === "0",
    );
    const hiddenAfterPointerExit = await peek.evaluate((node) => getComputedStyle(node).opacity);

    let keyboardTabCount = 0;
    while (keyboardTabCount < 20 && !(await classicButton.evaluate(
      (node) => document.activeElement === node,
    ))) {
      await page.keyboard.press("Tab");
      keyboardTabCount += 1;
    }
    await page.waitForFunction(() => {
      const button = document.querySelector('nav [data-od-id="magic-portal-toggle"]');
      const dog = button?.querySelector(".magic-portal-button__peek");
      return document.activeElement === button
        && button.matches(":focus-visible")
        && getComputedStyle(dog).opacity === "1";
    });
    const focusReveal = await classicButton.evaluate((node) => ({
      focusVisible: node.matches(":focus-visible"),
      height: node.offsetHeight,
      opacity: getComputedStyle(node.querySelector(".magic-portal-button__peek")).opacity,
      width: node.offsetWidth,
    }));
    if (hiddenAfterPointerExit !== "0" || !focusReveal.focusVisible || focusReveal.opacity !== "1") {
      throw new Error(`Keyboard focus did not reveal the dog after pointer exit: ${JSON.stringify({
        focusReveal,
        hiddenAfterPointerExit,
      })}`);
    }
    if (focusReveal.width !== buttonBefore.width || focusReveal.height !== buttonBefore.height) {
      throw new Error("The keyboard dog reveal changed the magic button geometry.");
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
    await startPortalVisibilityTrace(page, "opening", "nocturnal-idle");
    await classicButton.evaluate((node) => {
      node.focus({ preventScroll: true });
      node.click();
    });
    const openingState = await waitForIntermediatePortalFrame(page, "opening", closedState.clipPath);
    requireLiveIntermediateState(openingState, "opening", closedState.clipPath, "Opening");
    if (openingState.childInteractive !== "false" || openingState.childInert !== true) {
      throw new Error(`The child became interactive before opening completed: ${JSON.stringify(openingState)}`);
    }
    const portalAnimation = openingState.portalAnimation;
    if (!portalAnimation.includes("portal-rim-open")) {
      throw new Error(`The centered portal is missing its opening animation (${portalAnimation}).`);
    }
    await page.screenshot({
      path: resolve(screenshotDirectory, "portal-opening-1440.png"),
      fullPage: false,
      animations: "allow",
    });

    const openingVisibilityTrace = await finishPortalVisibilityTrace(page);
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
    const openingVisibility = requirePortalVisibilityTrace(
      openingVisibilityTrace,
      "classic-idle",
      "opening",
      "nocturnal-idle",
      fullState.clipPath,
      "Opening",
    );

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

    await startPortalVisibilityTrace(page, "closing", "classic-idle");
    await nocturnalButton.click();
    const closingState = await waitForIntermediatePortalFrame(page, "closing", fullState.clipPath);
    requireLiveIntermediateState(closingState, "closing", fullState.clipPath, "Closing");
    if (closingState.childInteractive !== "false" || closingState.childInert !== true) {
      throw new Error(`The child remained interactive while closing: ${JSON.stringify(closingState)}`);
    }
    await page.screenshot({
      path: resolve(screenshotDirectory, "portal-closing-1440.png"),
      fullPage: false,
      animations: "allow",
    });
    const closingVisibilityTrace = await finishPortalVisibilityTrace(page);
    await waitForPortalState(page, "classic", "classic-idle", "Portal return did not settle");
    await page.waitForFunction(() => {
      const body = document.querySelector('[data-od-id="new-world-frame"]')?.contentDocument?.body;
      return body?.dataset.portalInteractive === "false" && body.inert === true;
    });
    const returnedState = await inspectPortalLayer(page);
    if (returnedState.phase !== "classic-idle" || returnedState.clipPath !== closedState.clipPath
      || returnedState.visibility !== "visible" || returnedState.childInteractive !== "false"
      || returnedState.childInert !== true || !returnedState.classicVisible) {
      throw new Error(`Closing did not finish on the clipped classic world: ${JSON.stringify(returnedState)}`);
    }
    const closingVisibility = requirePortalVisibilityTrace(
      closingVisibilityTrace,
      "nocturnal-idle",
      "closing",
      "classic-idle",
      closedState.clipPath,
      "Closing",
    );

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
      closingVisibility,
      focusReveal: {
        ...focusReveal,
        hiddenAfterPointerExit,
        keyboardTabCount,
      },
      focusHandoff: true,
      gazeMeasurements,
      irisTransforms,
      nocturnalState,
      openingVisibility,
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

async function beginReducedAnimationCapture(page, direction) {
  await page.evaluate((captureDirection) => {
    const captures = [];
    const handler = (event) => {
      if (!event.animationName.endsWith("-reduced")) return;
      const animation = event.target.getAnimations()
        .find((candidate) => candidate.animationName === event.animationName);
      if (!animation?.effect) return;

      const computed = getComputedStyle(event.target);
      const computedTiming = animation.effect.getComputedTiming();
      captures.push({
        animationName: event.animationName,
        computedDuration: computed.animationDuration,
        direction: captureDirection,
        durationMs: Number(computedTiming.duration),
        frames: animation.effect.getKeyframes().map((frame) => ({
          clipPath: frame.clipPath ?? null,
          easing: frame.easing,
          offset: frame.offset,
          opacity: frame.opacity ?? null,
          transform: frame.transform ?? null,
        })),
        target: event.target.matches('[data-od-id="new-world-layer"]')
          ? "world"
          : event.target.matches(".portal-transition__disc") ? "rim" : "other",
        timingFunction: computed.animationTimingFunction,
      });
    };

    window.__reducedAnimationCapture = { captures, handler };
    document.addEventListener("animationstart", handler, true);
  }, direction);
}

async function finishReducedAnimationCapture(page) {
  await page.waitForFunction(() => {
    const captures = window.__reducedAnimationCapture?.captures ?? [];
    return captures.some((capture) => capture.target === "world")
      && captures.some((capture) => capture.target === "rim");
  }, null, { polling: "raf", timeout: 5_000 });

  return page.evaluate(() => {
    const capture = window.__reducedAnimationCapture;
    document.removeEventListener("animationstart", capture.handler, true);
    delete window.__reducedAnimationCapture;
    return capture.captures;
  });
}

function requireReducedMotionTransition(captures, direction) {
  const worldName = `portal-world-${direction}-reduced`;
  const rimName = `portal-rim-${direction}-reduced`;
  const world = captures.find((capture) => capture.animationName === worldName);
  const rim = captures.find((capture) => capture.animationName === rimName);
  if (!world || !rim) {
    throw new Error(`Reduced ${direction} animations were not both captured: ${JSON.stringify(captures)}`);
  }

  for (const animation of [world, rim]) {
    if (animation.durationMs !== 120 || animation.computedDuration !== "0.12s") {
      throw new Error(`Reduced ${direction} duration is not 120ms: ${JSON.stringify(animation)}`);
    }
    if (animation.timingFunction === "linear" || !animation.timingFunction.startsWith("cubic-bezier(")) {
      throw new Error(`Reduced ${direction} easing is not responsive: ${animation.timingFunction}`);
    }
    if (JSON.stringify(animation.frames).includes("calc(")) {
      throw new Error(`Reduced ${direction} retains an off-center shake: ${JSON.stringify(animation.frames)}`);
    }
  }

  const centeredClipPattern = /^circle\(([\d.]+)px(?: at 50% 50%)?\)$/;
  const centeredClipRadii = world.frames.map((frame) => (
    Number(frame.clipPath?.match(centeredClipPattern)?.[1])
  ));
  const viewportCoverRadius = Math.hypot(1280, 800) / 2;
  if (world.frames.length < 2
    || new Set(world.frames.map((frame) => frame.clipPath)).size !== 1
    || centeredClipRadii.some((radius) => !Number.isFinite(radius) || radius < viewportCoverRadius)) {
    throw new Error(`Reduced ${direction} world is not a full centered opacity reveal: ${JSON.stringify(world.frames)}`);
  }

  const expectedOpacity = direction === "open" ? [0, 1] : [1, 0];
  const worldOpacity = [
    Number(world.frames.at(0).opacity),
    Number(world.frames.at(-1).opacity),
  ];
  if (worldOpacity.some((opacity, index) => opacity !== expectedOpacity[index])) {
    throw new Error(`Reduced ${direction} world is not opacity-led: ${JSON.stringify(world.frames)}`);
  }

  const rimScales = rim.frames.map((frame) => {
    if (!/^translate\(-50%,\s*-50%\) scale\([\d.]+\)$/.test(frame.transform ?? "")) {
      throw new Error(`Reduced ${direction} rim is not centered: ${JSON.stringify(rim.frames)}`);
    }
    return Number(frame.transform.match(/scale\(([\d.]+)\)/)?.[1]);
  });
  const rimScaleDelta = Math.max(...rimScales) - Math.min(...rimScales);
  if (rimScales.some((scale) => !Number.isFinite(scale) || scale < 0.85 || scale > 1.15)
    || rimScaleDelta > 0.15) {
    throw new Error(`Reduced ${direction} rim scale is too large: ${JSON.stringify(rimScales)}`);
  }

  return {
    rim,
    rimScaleDelta: Math.round(rimScaleDelta * 1_000) / 1_000,
    world,
    worldOpacity,
  };
}

async function verifyReducedMotion(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => (
      document.querySelector('[data-od-id="new-world-frame"]')?.dataset.ready === "true"
    ));

    await beginReducedAnimationCapture(page, "open");
    await page.locator('nav [data-od-id="magic-portal-toggle"]').click();
    const openingAnimations = requireReducedMotionTransition(
      await finishReducedAnimationCapture(page),
      "open",
    );
    await waitForPortalState(page, "nocturnal", "nocturnal-idle", "Reduced-motion entry did not settle");
    await page.waitForFunction(() => {
      const button = document.querySelector('[data-od-id="nocturnal-portal-control"] button');
      const body = document.querySelector('[data-od-id="new-world-frame"]')?.contentDocument?.body;
      return document.activeElement === button
        && body?.dataset.portalInteractive === "true"
        && body.inert === false;
    });
    const openingSettled = await inspectPortalLayer(page);

    await beginReducedAnimationCapture(page, "close");
    await page.locator('[data-od-id="nocturnal-portal-control"] button').click();
    const closingAnimations = requireReducedMotionTransition(
      await finishReducedAnimationCapture(page),
      "close",
    );
    await waitForPortalState(page, "classic", "classic-idle", "Reduced-motion return did not settle");
    await page.waitForFunction(() => {
      const button = document.querySelector('nav [data-od-id="magic-portal-toggle"]');
      const body = document.querySelector('[data-od-id="new-world-frame"]')?.contentDocument?.body;
      return document.activeElement === button
        && body?.dataset.portalInteractive === "false"
        && body.inert === true;
    });
    const closingSettled = await inspectPortalLayer(page);

    return {
      closing: { ...closingAnimations, settled: closingSettled },
      focusHandoff: true,
      opening: { ...openingAnimations, settled: openingSettled },
    };
  } finally {
    await page.close();
  }
}

async function verifyTouchNoHover(browser) {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const browserErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => (
      document.querySelector('[data-od-id="new-world-frame"]')?.dataset.ready === "true"
    ));

    const button = page.locator('nav [data-od-id="magic-portal-toggle"]');
    const peek = button.locator(".magic-portal-button__peek");
    const initial = await button.evaluate((node) => ({
      height: node.offsetHeight,
      peekOpacity: getComputedStyle(node.querySelector(".magic-portal-button__peek")).opacity,
      transform: getComputedStyle(node).transform,
      width: node.offsetWidth,
    }));
    const capabilities = await page.evaluate(() => ({
      finePointerHover: matchMedia("(hover: hover) and (pointer: fine)").matches,
      hover: matchMedia("(hover: hover)").matches,
      pointerFine: matchMedia("(pointer: fine)").matches,
    }));
    if (capabilities.finePointerHover || capabilities.hover || capabilities.pointerFine) {
      throw new Error(`Touch context unexpectedly matches fine-pointer hover: ${JSON.stringify(capabilities)}`);
    }

    await button.hover();
    await page.waitForTimeout(450);
    const syntheticHover = await button.evaluate((node) => ({
      matchesHover: node.matches(":hover"),
      peekOpacity: getComputedStyle(node.querySelector(".magic-portal-button__peek")).opacity,
      transform: getComputedStyle(node).transform,
    }));
    if (syntheticHover.peekOpacity !== "0" || syntheticHover.transform !== initial.transform) {
      throw new Error(`Synthetic hover animated the touch portal: ${JSON.stringify({ initial, syntheticHover })}`);
    }

    await page.mouse.move(0, 0);
    await button.evaluate((node) => {
      node.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
      }, { capture: true, once: true });
    });
    await button.tap();
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    await page.waitForTimeout(450);

    const touchState = await page.evaluate(() => {
      const portalButton = document.querySelector('nav [data-od-id="magic-portal-toggle"]');
      const dog = portalButton?.querySelector(".magic-portal-button__peek");
      return {
        buttonHeight: portalButton?.offsetHeight,
        buttonVisible: Boolean(portalButton?.getClientRects().length),
        buttonWidth: portalButton?.offsetWidth,
        focusVisible: portalButton?.matches(":focus-visible") ?? false,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        peekOpacity: dog ? getComputedStyle(dog).opacity : null,
      };
    });
    if (touchState.peekOpacity !== "0" || touchState.focusVisible) {
      throw new Error(`Touch interaction left the dog peek visible: ${JSON.stringify(touchState)}`);
    }
    if (touchState.buttonWidth !== initial.width || touchState.buttonHeight !== initial.height) {
      throw new Error(`Touch interaction changed the portal geometry: ${JSON.stringify({ initial, touchState })}`);
    }
    if (!touchState.buttonVisible || touchState.overflow > 1) {
      throw new Error(`Touch portal is hidden or overflowing: ${JSON.stringify(touchState)}`);
    }
    if (await peek.evaluate((node) => getComputedStyle(node).opacity) !== "0") {
      throw new Error("The dog peek became stuck after the touch sequence.");
    }
    if (browserErrors.length) {
      throw new Error(`Touch browser errors: ${browserErrors.join(" | ")}`);
    }

    return {
      browserErrors: browserErrors.length,
      capabilities,
      initial,
      syntheticHover,
      touchState,
    };
  } finally {
    await context.close();
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
let reducedMotion;
let touchNoHover;
try {
  await verifyReadinessHandshake(chromiumBrowser);
  detailed = await verifyDetailedChromiumFlow(chromiumBrowser);
  reducedMotion = await verifyReducedMotion(chromiumBrowser);
  touchNoHover = await verifyTouchNoHover(chromiumBrowser);
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
  reducedMotion,
  touchNoHover,
  engines: {
    Chromium: chromiumSmoke,
    WebKit: webkitSmoke,
  },
  detailed,
}, null, 2));
