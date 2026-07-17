# Live Portal Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing magic button reveal the live animal portfolio through a growing circular mask, reverse by shrinking that world away, and add a golden-retriever peek interaction without changing either portfolio's design.

**Architecture:** Keep the classic React portfolio and same-origin animal iframe mounted as persistent layers. A four-phase state machine controls a `clip-path` animation on the animal layer, while a small same-origin bridge reports paint readiness and disables the child document whenever it is clipped. The portal decoration remains a transparent rim, and the button owns an accessibility-hidden dog peek.

**Tech Stack:** React 18, Vite 8, Framer Motion 10, CSS keyframes/`clip-path`, Node's built-in test runner, Playwright 1.61.

## Global Constraints

- Work only on `codex/magic-portal-redesign` in `/Users/ken/Developer/github/cokenhe.github.io`.
- Preserve all existing classic-page content, layout, assets, links, Framer Motion interactions, and scroll behavior.
- Preserve the existing animal-page HTML, WebGL background, five animals, gaze tracking, selector, navigation, and assets; add only the parent bridge needed for portal coordination.
- Use the default golden retriever for the classic-button peek; do not synchronize it with the iframe selector.
- Opening lasts approximately 700 ms and shows the live animal page inside the expanding circle.
- Closing shrinks the live animal page into the centre and exposes the classic page underneath.
- Reduced motion lasts approximately 120 ms with no shake, bounce, or orbiting particles.
- Do not add a runtime animation library.
- Keep both worlds mounted; no `visibility` or mount change may occur on the opening completion frame.
- Validate parent/iframe messages by exact source, origin, scope, and message type.

---

### Task 1: Replace the atomic timer with a tested portal phase model

**Files:**
- Modify: `tests/portal-state.test.mjs`
- Modify: `src/portal-state.mjs`

**Interfaces:**
- Produces: `PORTAL_PHASE`, `beginPortalTransition(phase)`, `completePortalTransition(phase)`, `getWorldForPortalPhase(phase)`, `isPortalTransitioning(phase)`, and `getPortalTiming(reducedMotion)`.
- Preserves: `WORLD`, `getNextWorld(world)`, and `getPortalButtonCopy(world)`.

- [ ] **Step 1: Write failing phase-state tests**

Replace the obsolete atomic-swap timing test and add phase coverage:

```js
test("the portal follows legal opening and closing phases", async () => {
  const {
    PORTAL_PHASE,
    beginPortalTransition,
    completePortalTransition,
  } = await import(pathToFileURL(modulePath));

  assert.equal(
    beginPortalTransition(PORTAL_PHASE.CLASSIC_IDLE),
    PORTAL_PHASE.OPENING,
  );
  assert.equal(
    completePortalTransition(PORTAL_PHASE.OPENING),
    PORTAL_PHASE.NOCTURNAL_IDLE,
  );
  assert.equal(
    beginPortalTransition(PORTAL_PHASE.NOCTURNAL_IDLE),
    PORTAL_PHASE.CLOSING,
  );
  assert.equal(
    completePortalTransition(PORTAL_PHASE.CLOSING),
    PORTAL_PHASE.CLASSIC_IDLE,
  );
  assert.throws(() => beginPortalTransition(PORTAL_PHASE.OPENING));
  assert.throws(() => completePortalTransition(PORTAL_PHASE.CLASSIC_IDLE));
});

test("each portal phase exposes its world and transition state", async () => {
  const {
    PORTAL_PHASE,
    WORLD,
    getWorldForPortalPhase,
    isPortalTransitioning,
  } = await import(pathToFileURL(modulePath));

  assert.equal(getWorldForPortalPhase(PORTAL_PHASE.CLASSIC_IDLE), WORLD.CLASSIC);
  assert.equal(getWorldForPortalPhase(PORTAL_PHASE.OPENING), WORLD.CLASSIC);
  assert.equal(getWorldForPortalPhase(PORTAL_PHASE.NOCTURNAL_IDLE), WORLD.NOCTURNAL);
  assert.equal(getWorldForPortalPhase(PORTAL_PHASE.CLOSING), WORLD.NOCTURNAL);
  assert.equal(isPortalTransitioning(PORTAL_PHASE.CLASSIC_IDLE), false);
  assert.equal(isPortalTransitioning(PORTAL_PHASE.OPENING), true);
  assert.equal(isPortalTransitioning(PORTAL_PHASE.CLOSING), true);
});

test("portal timing includes an animation duration and guarded fallback", async () => {
  const { getPortalTiming } = await import(pathToFileURL(modulePath));

  assert.deepEqual(getPortalTiming(false), { durationMs: 700, fallbackMs: 900 });
  assert.deepEqual(getPortalTiming(true), { durationMs: 120, fallbackMs: 240 });
});
```

- [ ] **Step 2: Run the unit test and confirm RED**

Run: `node --test tests/portal-state.test.mjs`

Expected: FAIL because `PORTAL_PHASE` and phase helpers are not exported and timing still returns `swapMs`.

- [ ] **Step 3: Implement the minimal state model**

In `src/portal-state.mjs`, keep button copy unchanged and replace timing with:

```js
export const PORTAL_PHASE = Object.freeze({
  CLASSIC_IDLE: "classic-idle",
  OPENING: "opening",
  NOCTURNAL_IDLE: "nocturnal-idle",
  CLOSING: "closing",
});

const STANDARD_TIMING = Object.freeze({ durationMs: 700, fallbackMs: 900 });
const REDUCED_TIMING = Object.freeze({ durationMs: 120, fallbackMs: 240 });

export function beginPortalTransition(phase) {
  if (phase === PORTAL_PHASE.CLASSIC_IDLE) return PORTAL_PHASE.OPENING;
  if (phase === PORTAL_PHASE.NOCTURNAL_IDLE) return PORTAL_PHASE.CLOSING;
  throw new TypeError(`Cannot begin a portal transition from: ${phase}`);
}

export function completePortalTransition(phase) {
  if (phase === PORTAL_PHASE.OPENING) return PORTAL_PHASE.NOCTURNAL_IDLE;
  if (phase === PORTAL_PHASE.CLOSING) return PORTAL_PHASE.CLASSIC_IDLE;
  throw new TypeError(`Cannot complete an idle portal phase: ${phase}`);
}

export function getWorldForPortalPhase(phase) {
  if (phase === PORTAL_PHASE.CLASSIC_IDLE || phase === PORTAL_PHASE.OPENING) {
    return WORLD.CLASSIC;
  }
  if (phase === PORTAL_PHASE.NOCTURNAL_IDLE || phase === PORTAL_PHASE.CLOSING) {
    return WORLD.NOCTURNAL;
  }
  throw new TypeError(`Unknown portal phase: ${phase}`);
}

export function isPortalTransitioning(phase) {
  return phase === PORTAL_PHASE.OPENING || phase === PORTAL_PHASE.CLOSING;
}

export function getPortalTiming(shouldReduceMotion) {
  return shouldReduceMotion ? REDUCED_TIMING : STANDARD_TIMING;
}
```

- [ ] **Step 4: Run the phase tests and confirm GREEN**

Run: `node --test tests/portal-state.test.mjs`

Expected: all portal-state tests PASS.

- [ ] **Step 5: Commit the state model**

```bash
git add src/portal-state.mjs tests/portal-state.test.mjs
git commit -m "refactor: model portal transition phases"
```

---

### Task 2: Add a paint-readiness and child-input bridge

**Files:**
- Create: `src/public/new-world/portal-bridge.mjs`
- Create: `tests/portal-bridge.test.mjs`
- Modify: `src/public/new-world/index.html`
- Modify: `scripts/check-site.mjs`

**Interfaces:**
- Produces child-to-parent message `{ scope: "ken-portfolio-portal", type: "new-world-ready" }`.
- Consumes parent-to-child message `{ scope: "ken-portfolio-portal", type: "set-interactive", interactive: boolean }`.
- Produces testable helpers `isTrustedHostMessage(event, parentWindow, origin)` and `setDocumentInteractive(document, interactive)`.

- [ ] **Step 1: Write failing bridge tests**

Create `tests/portal-bridge.test.mjs`:

```js
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const bridgeUrl = pathToFileURL(resolve("src/public/new-world/portal-bridge.mjs"));

test("the child accepts only exact same-origin parent messages", async () => {
  const { PORTAL_SCOPE, isTrustedHostMessage } = await import(bridgeUrl);
  const parentWindow = {};
  const valid = {
    source: parentWindow,
    origin: "https://cokenhe.github.io",
    data: { scope: PORTAL_SCOPE, type: "set-interactive", interactive: true },
  };

  assert.equal(isTrustedHostMessage(valid, parentWindow, valid.origin), true);
  assert.equal(isTrustedHostMessage({ ...valid, source: {} }, parentWindow, valid.origin), false);
  assert.equal(isTrustedHostMessage({ ...valid, origin: "https://example.com" }, parentWindow, valid.origin), false);
  assert.equal(isTrustedHostMessage({ ...valid, data: { ...valid.data, scope: "other" } }, parentWindow, valid.origin), false);
});

test("the child makes its document inert and blurs retained focus", async () => {
  const { setDocumentInteractive } = await import(bridgeUrl);
  let blurred = false;
  const document = {
    body: { inert: false, dataset: {} },
    activeElement: { blur: () => { blurred = true; } },
  };

  setDocumentInteractive(document, false);
  assert.equal(document.body.inert, true);
  assert.equal(document.body.dataset.portalInteractive, "false");
  assert.equal(blurred, true);

  setDocumentInteractive(document, true);
  assert.equal(document.body.inert, false);
  assert.equal(document.body.dataset.portalInteractive, "true");
});
```

Add `src/public/new-world/portal-bridge.mjs` to `requiredFiles` in `scripts/check-site.mjs` before implementing it.

- [ ] **Step 2: Run tests and confirm RED**

Run: `node --test tests/portal-bridge.test.mjs && node scripts/check-site.mjs`

Expected: FAIL because the bridge module does not exist.

- [ ] **Step 3: Implement the bridge helpers and runtime**

Create `src/public/new-world/portal-bridge.mjs` with these exported boundaries and an iframe-only initializer:

```js
export const PORTAL_SCOPE = "ken-portfolio-portal";
export const PORTAL_MESSAGE = Object.freeze({
  READY: "new-world-ready",
  SET_INTERACTIVE: "set-interactive",
});

export function isTrustedHostMessage(event, parentWindow, origin) {
  return event.source === parentWindow
    && event.origin === origin
    && event.data?.scope === PORTAL_SCOPE
    && event.data?.type === PORTAL_MESSAGE.SET_INTERACTIVE
    && typeof event.data?.interactive === "boolean";
}

export function setDocumentInteractive(document, interactive) {
  document.body.inert = !interactive;
  document.body.dataset.portalInteractive = String(interactive);
  if (!interactive && document.activeElement !== document.body) {
    document.activeElement?.blur?.();
  }
}
```

The module runtime must:

```js
async function announceReady(window, document) {
  const dog = document.querySelector('[data-od-id="animal-image"]');
  const background = document.querySelector('[data-od-id="liquid-glass-background"]');
  if (typeof dog?.decode === "function") await dog.decode().catch(() => {});
  await waitForFrameLoadOrTimeout(background, 1800);
  await nextAnimationFrame(window);
  await nextAnimationFrame(window);
  window.parent.postMessage(
    { scope: PORTAL_SCOPE, type: PORTAL_MESSAGE.READY },
    window.location.origin,
  );
}

function nextAnimationFrame(window) {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

function waitForFrameLoadOrTimeout(frame, timeoutMs) {
  if (!frame || frame.contentDocument?.readyState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let timer = 0;
    const finish = () => {
      frame.removeEventListener("load", finish);
      window.clearTimeout(timer);
      resolve();
    };
    frame.addEventListener("load", finish, { once: true });
    timer = window.setTimeout(finish, timeoutMs);
  });
}

function initializePortalBridge(window, document) {
  if (window.parent === window) return;
  setDocumentInteractive(document, false);
  window.addEventListener("message", (event) => {
    if (!isTrustedHostMessage(event, window.parent, window.location.origin)) return;
    setDocumentInteractive(document, event.data.interactive);
  });
  void announceReady(window, document);
}
```

End the module with this Node-safe auto-initialization guard:

```js
if (typeof window !== "undefined" && typeof document !== "undefined") {
  initializePortalBridge(window, document);
}
```

- [ ] **Step 4: Load the bridge after the preserved inline behavior**

At the bottom of `src/public/new-world/index.html`, immediately before `</body>`, add:

```html
<script type="module" src="portal-bridge.mjs"></script>
```

Do not alter the animal picker, gaze code, WebGL iframe, content, or assets.

- [ ] **Step 5: Run bridge and structural tests and confirm GREEN**

Run: `node --test tests/portal-bridge.test.mjs && node scripts/check-site.mjs`

Expected: bridge tests and structural checks PASS.

- [ ] **Step 6: Commit the child bridge**

```bash
git add src/public/new-world/index.html src/public/new-world/portal-bridge.mjs tests/portal-bridge.test.mjs scripts/check-site.mjs
git commit -m "feat: coordinate portal iframe readiness"
```

---

### Task 3: Add the golden-retriever button peek

**Files:**
- Modify: `scripts/check-site.mjs`
- Modify: `src/components/MagicPortalButton.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: existing public dog art at `${import.meta.env.BASE_URL}new-world/clone-assets/animals/dog.png`.
- Produces: accessibility-hidden `.magic-portal-button__peek`, two eye sockets, and two irises only for `variant === "classic"`.

- [ ] **Step 1: Add failing structural assertions**

Extend the `magicButton` markers in `scripts/check-site.mjs` with:

```js
"magic-portal-button__peek",
"new-world/clone-assets/animals/dog.png",
"aria-hidden=\"true\"",
```

Extend the `styles` markers with:

```js
".magic-portal-button__peek-eye",
"@media (hover: hover)",
".magic-portal-button--classic:focus-visible .magic-portal-button__peek",
```

- [ ] **Step 2: Run the structural check and confirm RED**

Run: `node scripts/check-site.mjs`

Expected: FAIL with `Missing portal marker: magic-portal-button__peek`.

- [ ] **Step 3: Add decorative dog markup**

Inside `MagicPortalButton`, immediately before the halo, render only for the classic variant:

```jsx
{variant === "classic" && (
  <span className="magic-portal-button__peek" aria-hidden="true">
    <img
      className="magic-portal-button__peek-animal"
      src={`${import.meta.env.BASE_URL}new-world/clone-assets/animals/dog.png`}
      alt=""
      draggable="false"
    />
    <span className="magic-portal-button__peek-eye magic-portal-button__peek-eye--left">
      <span className="magic-portal-button__peek-iris" />
    </span>
    <span className="magic-portal-button__peek-eye magic-portal-button__peek-eye--right">
      <span className="magic-portal-button__peek-iris" />
    </span>
  </span>
)}
```

- [ ] **Step 4: Style the peek, gaze, and input fallbacks**

Add focused styles near the existing magic-button rules:

```css
.magic-portal-button__peek {
  position: absolute;
  left: 50%;
  bottom: calc(100% - 2px);
  z-index: -1;
  width: 96px;
  height: 78px;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transform: translate3d(-50%, 62px, 0) rotate(0deg) scale(0.86);
  transform-origin: 50% 100%;
  transition: opacity 160ms ease, transform 420ms cubic-bezier(0.2, 0.82, 0.2, 1.18);
}

.magic-portal-button__peek-animal {
  position: absolute;
  inset: 0 auto auto 50%;
  width: 96px;
  height: 96px;
  max-width: none;
  transform: translateX(-50%);
  filter: drop-shadow(0 8px 8px rgba(28, 18, 8, 0.2));
}

.magic-portal-button__peek-eye {
  position: absolute;
  top: 27.83%;
  width: 7.7%;
  aspect-ratio: 1;
  border-radius: 50%;
}

.magic-portal-button__peek-eye--left { left: 33.82%; }
.magic-portal-button__peek-eye--right { left: 57.78%; }

.magic-portal-button__peek-iris {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 58%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 36% 32%, #d8b780 0 12%, #72563a 38% 72%, #17100b 74%);
  transform: translate(-50%, -50%) translate(var(--peek-gaze-x, 0), 3px);
}

.magic-portal-button__peek-eye--left { --peek-gaze-x: 1.5px; }
.magic-portal-button__peek-eye--right { --peek-gaze-x: -1.5px; }

@media (hover: hover) {
  .magic-portal-button--classic:hover:not(:disabled) .magic-portal-button__peek {
    opacity: 1;
    transform: translate3d(-50%, 0, 0) rotate(-3deg) scale(1);
  }
}

.magic-portal-button--classic:focus-visible .magic-portal-button__peek {
  opacity: 1;
  transform: translate3d(-50%, 0, 0) rotate(-3deg) scale(1);
}
```

Under the existing reduced-motion and mobile queries, add:

```css
@media (max-width: 680px) {
  .magic-portal-button__peek {
    width: 82px;
    height: 68px;
  }

  .magic-portal-button__peek-animal {
    width: 82px;
    height: 82px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .magic-portal-button__peek {
    transition: opacity 120ms linear, transform 120ms linear;
  }
}
```

- [ ] **Step 5: Run structural and unit tests and confirm GREEN**

Run: `npm test`

Expected: all checks and unit tests PASS.

- [ ] **Step 6: Commit the dog peek**

```bash
git add src/components/MagicPortalButton.jsx src/styles.css scripts/check-site.mjs
git commit -m "feat: add peeking portal companion"
```

---

### Task 4: Reveal the live animal layer through the portal mask

**Files:**
- Modify: `scripts/check-site.mjs`
- Modify: `src/App.jsx`
- Modify: `src/components/PortalTransition.jsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: Task 1 phase helpers and Task 2 message protocol.
- Produces: `.new-world-layer` with `data-phase`, `portal-world-open`, and `portal-world-close` animations.
- Produces: `PortalTransition({ phase, reducedMotion })` with transparent opening/closing rim.

- [ ] **Step 1: Add failing integration markers**

Update `scripts/check-site.mjs` so the old atomic markers are replaced with:

```js
[app, [
  "ClassicPortfolio",
  "new-world/index.html",
  "data-world={world}",
  "PORTAL_PHASE",
  "onAnimationEnd={handlePortalAnimationEnd}",
  "ken-portfolio-portal",
]],
[portalTransition, [
  "portal-transition__disc",
  "data-state",
  "phase",
]],
[styles, [
  "@keyframes portal-world-open",
  "@keyframes portal-world-close",
  "clip-path: circle(150vmax",
  "@keyframes magic-spark",
  "prefers-reduced-motion",
]],
```

- [ ] **Step 2: Run the structural check and confirm RED**

Run: `node scripts/check-site.mjs`

Expected: FAIL because the app still uses an atomic `crossPortal` timer and the iframe still uses `visibility: hidden`.

- [ ] **Step 3: Convert `App` to the phase model**

Import Task 1's phase helpers. Replace `world`, `destination`, and `isTransitioning` state with:

```jsx
const [portalPhase, setPortalPhase] = useState(PORTAL_PHASE.CLASSIC_IDLE);
const world = getWorldForPortalPhase(portalPhase);
const destination = getNextWorld(world);
const isTransitioning = isPortalTransitioning(portalPhase);
```

Add `newWorldFrame` and a phase-scoped fallback ref. Listen for readiness with exact validation:

```jsx
useEffect(() => {
  const handleMessage = (event) => {
    if (event.source !== newWorldFrame.current?.contentWindow) return;
    if (event.origin !== window.location.origin) return;
    if (event.data?.scope !== "ken-portfolio-portal") return;
    if (event.data?.type !== "new-world-ready") return;
    setIsNewWorldReady(true);
  };
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, []);
```

Whenever phase/readiness changes, post the validated interactivity message:

```jsx
useEffect(() => {
  if (!isNewWorldReady) return;
  newWorldFrame.current?.contentWindow?.postMessage({
    scope: "ken-portfolio-portal",
    type: "set-interactive",
    interactive: portalPhase === PORTAL_PHASE.NOCTURNAL_IDLE,
  }, window.location.origin);
}, [isNewWorldReady, portalPhase]);
```

Implement guarded completion, the animation handler, fallback, and activation as:

```jsx
const finishPortalTransition = (expectedPhase) => {
  setPortalPhase((currentPhase) => (
    currentPhase === expectedPhase
      ? completePortalTransition(currentPhase)
      : currentPhase
  ));
};

const handlePortalAnimationEnd = (event) => {
  if (event.target !== event.currentTarget || !isTransitioning) return;
  finishPortalTransition(portalPhase);
};

useEffect(() => {
  if (!isTransitioning) return undefined;
  const expectedPhase = portalPhase;
  const fallback = window.setTimeout(
    () => finishPortalTransition(expectedPhase),
    getPortalTiming(shouldReduceMotion).fallbackMs,
  );
  return () => window.clearTimeout(fallback);
}, [isTransitioning, portalPhase, shouldReduceMotion]);

const crossPortal = () => {
  if (isTransitioning || (world === WORLD.CLASSIC && !isNewWorldReady)) return;
  if (world === WORLD.CLASSIC) classicScrollPosition.current = window.scrollY;
  restoreAfterSwap.current = true;
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  setPortalPhase((currentPhase) => beginPortalTransition(currentPhase));
};
```

Replace the existing world-based focus effect with:

```jsx
useLayoutEffect(() => {
  if (!restoreAfterSwap.current || isTransitioning) return;
  restoreAfterSwap.current = false;
  const destinationButton = world === WORLD.NOCTURNAL
    ? nocturnalPortalButton.current
    : classicPortalButton.current;
  destinationButton?.focus({ preventScroll: true });

  if (world === WORLD.CLASSIC) {
    window.cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = window.requestAnimationFrame(() => {
      window.scrollTo({ top: classicScrollPosition.current, behavior: "auto" });
    });
  }
}, [isTransitioning, portalPhase, world]);
```

- [ ] **Step 4: Keep both worlds mounted and isolate input**

Replace the conditional classic mount and bare iframe with this layer structure:

```jsx
<div
  className="classic-world"
  data-od-id="classic-world"
  aria-hidden={portalPhase !== PORTAL_PHASE.CLASSIC_IDLE}
  inert={portalPhase === PORTAL_PHASE.CLASSIC_IDLE ? undefined : ""}
>
  <ClassicPortfolio portalControl={portalControl} />
</div>

<div
  className={`new-world-layer new-world-layer--${portalPhase}`}
  data-od-id="new-world-layer"
  data-phase={portalPhase}
  onAnimationEnd={handlePortalAnimationEnd}
>
  <iframe
    ref={newWorldFrame}
    className="new-world-frame"
    id="new-world-frame"
    src={`${import.meta.env.BASE_URL}new-world/index.html`}
    title="Ken He nocturnal portfolio"
    aria-hidden={portalPhase !== PORTAL_PHASE.NOCTURNAL_IDLE}
    tabIndex={portalPhase === PORTAL_PHASE.NOCTURNAL_IDLE ? 0 : -1}
    data-od-id="new-world-frame"
    data-ready={isNewWorldReady}
  />
</div>
```

Because `getWorldForPortalPhase(CLOSING)` remains nocturnal, retain the dock with:

```jsx
{world === WORLD.NOCTURNAL && (
  <div className="portal-dock" data-od-id="nocturnal-portal-control">
    <MagicPortalButton
      busy={isTransitioning}
      buttonRef={nocturnalPortalButton}
      onActivate={crossPortal}
      variant="nocturnal"
      world={world}
    />
  </div>
)}
```

- [ ] **Step 5: Make `PortalTransition` a transparent directional rim**

Change the component contract to:

```jsx
function PortalTransition({ phase, reducedMotion }) {
  const active = phase === "opening" || phase === "closing";
  return (
    <div
      className={`portal-transition portal-transition--${phase}${active ? " is-active" : ""}${reducedMotion ? " is-reduced" : ""}`}
      aria-hidden="true"
      data-od-id="portal-transition"
      data-state={active ? "active" : "idle"}
      data-direction={active ? phase : "idle"}
    >
      <div className="portal-transition__disc">
        <span className="portal-transition__ring portal-transition__ring--outer" />
        <span className="portal-transition__ring portal-transition__ring--inner" />
        <span className="portal-transition__star portal-transition__star--one">✦</span>
        <span className="portal-transition__star portal-transition__star--two">✧</span>
        <span className="portal-transition__star portal-transition__star--three">✦</span>
      </div>
    </div>
  );
}
```

Replace the disc fill/animation rules with:

```css
.portal-transition__disc {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10vmax;
  aspect-ratio: 1;
  border: 2px solid color-mix(in srgb, var(--portal-center) 78%, transparent);
  border-radius: 50%;
  background: transparent;
  box-shadow:
    0 0 28px 8px color-mix(in srgb, var(--portal-mid) 55%, transparent),
    inset 0 0 22px color-mix(in srgb, var(--portal-center) 42%, transparent);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.02);
  will-change: transform, opacity, filter;
}

.portal-transition--opening.is-active .portal-transition__disc {
  animation: portal-rim-open 700ms cubic-bezier(0.2, 0.72, 0.15, 1) both;
}

.portal-transition--closing.is-active .portal-transition__disc {
  animation: portal-rim-close 700ms cubic-bezier(0.55, 0.02, 0.8, 0.35) both;
}

@keyframes portal-rim-open {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.02); }
  8% { opacity: 1; }
  14% { transform: translate(calc(-50% - 7px), calc(-50% + 3px)) scale(0.12); }
  26% { transform: translate(calc(-50% + 8px), calc(-50% - 5px)) scale(0.28); }
  42% { transform: translate(-50%, -50%) scale(2); }
  100% { opacity: 0.2; transform: translate(-50%, -50%) scale(30); }
}

@keyframes portal-rim-close {
  0% { opacity: 0.2; transform: translate(-50%, -50%) scale(30); }
  58% { opacity: 1; transform: translate(-50%, -50%) scale(2); }
  78% { transform: translate(calc(-50% - 6px), calc(-50% + 3px)) scale(0.28); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.02); }
}
```

- [ ] **Step 6: Animate the actual world layer's clip**

Replace the iframe visibility rules with:

```css
.new-world-layer {
  position: fixed;
  inset: 0;
  z-index: 40;
  overflow: hidden;
  clip-path: circle(0 at 50% 50%);
  pointer-events: none;
  will-change: clip-path;
  contain: layout paint style;
  transform: translateZ(0);
}

.new-world-layer--opening {
  animation: portal-world-open 700ms cubic-bezier(0.2, 0.72, 0.15, 1) both;
}

.new-world-layer--nocturnal-idle {
  clip-path: circle(150vmax at 50% 50%);
  pointer-events: auto;
}

.new-world-layer--closing {
  animation: portal-world-close 700ms cubic-bezier(0.55, 0.02, 0.8, 0.35) both;
}

.new-world-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #172125;
}

@keyframes portal-world-open {
  0% { clip-path: circle(0 at 50% 50%); }
  12% { clip-path: circle(1.2vmax at calc(50% - 7px) calc(50% + 3px)); }
  20% { clip-path: circle(2.4vmax at calc(50% + 8px) calc(50% - 5px)); }
  30% { clip-path: circle(4.8vmax at calc(50% - 8px) calc(50% + 5px)); }
  42% { clip-path: circle(10vmax at 50% 50%); }
  100% { clip-path: circle(150vmax at 50% 50%); }
}

@keyframes portal-world-close {
  0% { clip-path: circle(150vmax at 50% 50%); }
  58% { clip-path: circle(10vmax at 50% 50%); }
  72% { clip-path: circle(4.8vmax at calc(50% + 7px) calc(50% - 4px)); }
  84% { clip-path: circle(2.1vmax at calc(50% - 6px) calc(50% + 3px)); }
  100% { clip-path: circle(0 at 50% 50%); }
}
```

Add exact reduced-motion overrides and keep the existing body overflow locking:

```css
@keyframes portal-world-open-reduced {
  from { clip-path: circle(0 at 50% 50%); }
  to { clip-path: circle(150vmax at 50% 50%); }
}

@keyframes portal-world-close-reduced {
  from { clip-path: circle(150vmax at 50% 50%); }
  to { clip-path: circle(0 at 50% 50%); }
}

@media (prefers-reduced-motion: reduce) {
  .new-world-layer--opening {
    animation: portal-world-open-reduced 120ms linear both !important;
  }

  .new-world-layer--closing {
    animation: portal-world-close-reduced 120ms linear both !important;
  }

  .portal-transition--opening.is-active .portal-transition__disc {
    animation: portal-rim-open 120ms linear both !important;
  }

  .portal-transition--closing.is-active .portal-transition__disc {
    animation: portal-rim-close 120ms linear both !important;
  }
}
```

- [ ] **Step 7: Run unit, structural, and production-build checks**

Run: `npm test && npm run build`

Expected: all tests PASS and Vite produces the GitHub Pages build with copied `new-world/portal-bridge.mjs`.

- [ ] **Step 8: Commit the live reveal**

```bash
git add src/App.jsx src/components/PortalTransition.jsx src/styles.css scripts/check-site.mjs
git commit -m "feat: reveal live portfolio through portal"
```

---

### Task 5: Verify timing, mask contents, gaze, focus, and browser fallbacks

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `scripts/verify-portal.mjs`
- Modify: `README.md`

**Interfaces:**
- Produces: locally reproducible `npm run test:e2e -- <preview-url>` using project-owned Playwright.
- Verifies: readiness handshake, intermediate opening/closing mask, no completion visibility swap, dog peek/gaze, focus handoff, scroll restoration, reduced motion, mobile layout, Chromium, and WebKit.

- [ ] **Step 1: Install the verifier dependency**

Run: `npm install --save-dev playwright@^1.61.1`

Expected: `package.json` and `package-lock.json` contain Playwright under `devDependencies`.

- [ ] **Step 2: Extend the readiness test to require the child handshake**

Keep the route gate for `new-world/index.html`, but after releasing it wait for both:

```js
await page.waitForFunction(() => {
  const frame = document.querySelector('[data-od-id="new-world-frame"]');
  return frame?.dataset.ready === "true"
    && frame.contentDocument?.body?.dataset.portalInteractive === "false";
});
```

Assert the classic button remains disabled before the handshake and enables only afterward.

Delete the later `transitionCapturePage.route("**/new-world/index.html", ...)` blank-document stub. The capture page must load the real child bridge and wait for `data-ready === "true"`; a blank iframe can no longer satisfy readiness.

- [ ] **Step 3: Verify the dog peek without moving the button**

Before opening, capture the button and peek state, then hover:

```js
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
```

- [ ] **Step 4: Verify live content at intermediate opening and closing frames**

Immediately after activation, wait about 350 ms and inspect:

```js
const openingState = await page.locator('[data-od-id="new-world-layer"]').evaluate((layer) => ({
  phase: layer.dataset.phase,
  clipPath: getComputedStyle(layer).clipPath,
  visibility: getComputedStyle(layer).visibility,
  childReady: layer.querySelector("iframe")?.contentDocument?.documentElement.classList.contains("is-ready"),
  classicVisible: Boolean(document.querySelector('[data-od-id="classic-world"]')?.getClientRects().length),
}));
```

Require `phase === "opening"`, `visibility === "visible"`, a nonzero/non-full `clipPath`, `childReady === true`, and `classicVisible === true`. Capture a screenshot showing animal content inside the circle.

After entry completes, assert the layer's `visibility` remained visible and the child body is interactive. Start closing, inspect at about 350 ms, and require `phase === "closing"`, a nonzero/non-full clip, live child content inside the clip, and the mounted classic world underneath. After completion require child `inert === true` and focus on the classic button.

- [ ] **Step 5: Add reduced-motion, mobile, and WebKit coverage**

Import both engines:

```js
import { chromium, webkit } from "playwright";
```

Add a reduced-motion page to the Chromium run:

```js
const reducedPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await reducedPage.emulateMedia({ reducedMotion: "reduce" });
await reducedPage.goto(url, { waitUntil: "domcontentloaded" });
await reducedPage.waitForFunction(() => (
  document.querySelector('[data-od-id="new-world-frame"]')?.dataset.ready === "true"
));
await reducedPage.locator('nav [data-od-id="magic-portal-toggle"]').click();
const reducedDuration = await reducedPage.locator('[data-od-id="new-world-layer"]').evaluate(
  (layer) => getComputedStyle(layer).animationDuration,
);
if (reducedDuration !== "0.12s") {
  throw new Error(`Reduced portal duration is ${reducedDuration}, expected 0.12s.`);
}
await waitForPortalState(reducedPage, "nocturnal", "idle", "Reduced-motion entry did not settle");
await reducedPage.locator('[data-od-id="nocturnal-portal-control"] button').click();
await waitForPortalState(reducedPage, "classic", "idle", "Reduced-motion return did not settle");
await reducedPage.close();
```

Preserve the existing 390x844 overflow/button assertions. Extract the core cross-browser smoke flow as:

```js
async function verifyEngine(browserType, engineName, checkCanvas) {
  const engineBrowser = await browserType.launch();
  const enginePage = await engineBrowser.newPage({ viewport: { width: 1280, height: 800 } });
  await enginePage.goto(url, { waitUntil: "domcontentloaded" });
  await enginePage.waitForFunction(() => (
    document.querySelector('[data-od-id="new-world-frame"]')?.dataset.ready === "true"
  ));
  await enginePage.locator('nav [data-od-id="magic-portal-toggle"]').click();
  await waitForPortalState(enginePage, "nocturnal", "idle", `${engineName} entry did not settle`);
  const preserved = await enginePage.locator('[data-od-id="new-world-frame"]').evaluate((frame) => {
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
    throw new Error(`${engineName} did not preserve the animal portfolio.`);
  }
  if (preserved.interactive !== "true" || (checkCanvas && !preserved.canvas)) {
    throw new Error(`${engineName} did not activate the destination correctly.`);
  }
  await enginePage.locator('[data-od-id="nocturnal-portal-control"] button').click();
  await waitForPortalState(enginePage, "classic", "idle", `${engineName} return did not settle`);
  await engineBrowser.close();
}

await verifyEngine(chromium, "Chromium", true);
await verifyEngine(webkit, "WebKit", false);
```

Keep the detailed WebGL canvas assertion in Chromium; WebKit only requires the preserved page title, five animal options, child interactivity, and successful portal travel so GPU availability does not create a false negative.

- [ ] **Step 6: Document exact run and verification commands**

Update `README.md` with:

```bash
npm install
npx playwright install chromium webkit
npm run dev

npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# In another terminal:
npm run test:e2e -- http://127.0.0.1:4173/

npm test
npm run verify
npm audit --audit-level=high
```

- [ ] **Step 7: Run the complete verification matrix**

Run, with the preview server kept in a separate terminal:

```bash
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
npm run test:e2e -- http://127.0.0.1:4173/
npm audit --audit-level=high
git diff --check
```

Expected: unit/structural tests PASS, build PASS, Chromium/WebKit portal verification PASS, audit reports 0 high vulnerabilities, and `git diff --check` prints nothing.

- [ ] **Step 8: Commit verifier and documentation changes**

```bash
git add package.json package-lock.json scripts/verify-portal.mjs README.md
git commit -m "test: verify live portal reveal"
```

---

### Task 6: Final review and branch handoff

**Files:**
- Review only: all files changed since `62a645e`

**Interfaces:**
- Consumes: completed Tasks 1-5.
- Produces: a clean, reviewed feature branch with reproducible run, preview, and verification commands.

- [ ] **Step 1: Review the full authored diff**

Run:

```bash
git diff --stat 62a645e..HEAD
git diff 62a645e..HEAD -- src tests scripts package.json package-lock.json README.md
```

Expected: only portal state, bridge, dog peek, mask integration, tests, dependency metadata, and documentation changed.

- [ ] **Step 2: Scan the committed branch for secrets**

Run:

```bash
git grep -n -I -E 'AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-[0-9A-Za-z_-]{20,}|gh[pousr]_[0-9A-Za-z]{36,}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY' HEAD
```

Expected: no matches.

- [ ] **Step 3: Request correctness and animation review**

Provide reviewers with the design spec, this plan, the full diff from `62a645e`, and the verification output. Resolve every critical/high finding and rerun the relevant tests.

- [ ] **Step 4: Confirm branch state**

Run:

```bash
git branch --show-current
git status --short
git log --oneline -8
```

Expected: branch is `codex/magic-portal-redesign`, worktree is clean, and all portal commits are present locally.
