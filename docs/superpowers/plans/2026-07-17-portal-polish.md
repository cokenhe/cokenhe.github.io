# Portal Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the approved live portal design while making the classic-button dog smaller and fully framed, fitting the nocturnal hero into the first desktop viewport, and removing the compositor hitch from both portal directions.

**Architecture:** Extend the existing project-owned Playwright verifier before changing CSS. The classic dog remains a decorative child of the existing button, the nocturnal page remains the same same-origin iframe, and the live world reveal continues to use the existing `clip-path`; only the oversized decorative rim's paint window is shortened.

**Tech Stack:** React 18, Vite, CSS animations, same-origin HTML iframe, Node.js, Playwright

---

### Task 1: Lock the three regressions into the browser verifier

**Files:**
- Modify: `scripts/verify-portal.mjs`

- [ ] **Step 1: Add failing dog-framing assertions**

After the existing hover wait, measure the button, peek wrapper, and dog image. Assert that the dog uses a negative stacking level, the wrapper does not clip it, the image is no wider than 60% of the button, its complete transformed bounds remain inside the viewport, its centre is above and to the right of the button centre, and the dog still overlaps the button so it reads as emerging from behind it.

```js
const peekGeometry = await classicButton.evaluate((button) => {
  const buttonRect = button.getBoundingClientRect();
  const peekNode = button.querySelector(".magic-portal-button__peek");
  const imageNode = button.querySelector(".magic-portal-button__peek-animal");
  const peekRect = peekNode.getBoundingClientRect();
  const imageRect = imageNode.getBoundingClientRect();
  const overlap = {
    x: Math.max(0, Math.min(buttonRect.right, imageRect.right) - Math.max(buttonRect.left, imageRect.left)),
    y: Math.max(0, Math.min(buttonRect.bottom, imageRect.bottom) - Math.max(buttonRect.top, imageRect.top)),
  };
  return {
    button: { left: buttonRect.left, right: buttonRect.right, top: buttonRect.top, bottom: buttonRect.bottom, width: buttonRect.width },
    image: { left: imageRect.left, right: imageRect.right, top: imageRect.top, bottom: imageRect.bottom, width: imageRect.width },
    overlap,
    peek: { overflow: getComputedStyle(peekNode).overflow, zIndex: Number(getComputedStyle(peekNode).zIndex) },
    viewport: { width: innerWidth, height: innerHeight },
  };
});
```

Update the gaze assertion to require both irises to move left and down with an alignment above `0.85`, because the new top-right dog looks diagonally back toward the pill instead of looking cross-eyed toward its own centre.

- [ ] **Step 2: Add failing nocturnal first-section assertions**

After entry settles, inspect the child document at `1440 x 900`. Require `.hero` to establish the metric rail's containing block, the eyebrow-to-header gap to be between 8px and 40px, the hero and animal to finish inside the viewport, the picker to end before the metric rail begins, and the metric rail to sit inside the hero before `#impact`.

```js
const firstSectionLayout = await page.locator('[data-od-id="new-world-frame"]').evaluate((frame) => {
  const child = frame.contentDocument;
  const rect = (selector) => {
    const bounds = child.querySelector(selector).getBoundingClientRect();
    return { top: bounds.top, bottom: bounds.bottom, height: bounds.height };
  };
  return {
    animal: rect(".animal"),
    eyebrow: rect(".hero .eyebrow"),
    header: rect(".site-header"),
    hero: rect(".hero"),
    heroPosition: getComputedStyle(child.querySelector(".hero")).position,
    impact: rect("#impact"),
    metrics: rect(".metric-rail"),
    picker: rect(".animal-picker"),
    viewportHeight: frame.contentWindow.innerHeight,
  };
});
```

- [ ] **Step 3: Add failing standard-rim keyframe assertions**

Capture `portal-rim-open` and `portal-rim-close` through the Web Animations API at `animationstart`. Parse each keyframe's `scale(...)` and opacity, then require every maximum-scale keyframe to have opacity `0`. Preserve the existing assertions that the world layer runs `portal-world-open`/`portal-world-close` and reaches the same endpoint clips.

```js
function requireLightweightPortalRim(capture, direction) {
  const frames = capture.frames.map((frame) => ({
    opacity: Number(frame.opacity),
    scale: Number(frame.transform?.match(/scale\(([\d.]+)\)/)?.[1]),
  }));
  const maximumScale = Math.max(...frames.map((frame) => frame.scale));
  const largestFrames = frames.filter((frame) => frame.scale === maximumScale);
  if (!largestFrames.length || largestFrames.some((frame) => frame.opacity !== 0)) {
    throw new Error(`The ${direction} rim paints at its maximum scale: ${JSON.stringify(frames)}`);
  }
  return { frames, maximumScale };
}
```

- [ ] **Step 4: Run the verifier and confirm RED**

Run:

```bash
npm run test:e2e -- http://127.0.0.1:4173/
```

Expected: FAIL on the current 96px clipped/centred dog, the 1044px static-position hero with its metric rail at the bottom of `main`, and the standard rim's non-zero opacity at scale `30`.

### Task 2: Implement the minimal visual fixes

**Files:**
- Modify: `src/styles.css`
- Modify: `src/public/new-world/index.html`
- Generated by build: `new-world/index.html`

- [ ] **Step 1: Reframe the classic-button dog**

Change the peek wrapper to a 58px square with `overflow: visible`, `right: -34px`, `top: -12px`, and `z-index: -1`. Remove the centred 96px image transform, use the same 58px square for the image, reveal it from a short down-left offset, and aim both irises `-1.5px` horizontally and `1px` vertically toward the button. Replace the existing 82px mobile override with a 52px wrapper/image so keyboard focus cannot restore the oversized framing at narrow widths.

```css
.magic-portal-button__peek {
  left: auto;
  right: -34px;
  top: -12px;
  bottom: auto;
  width: 58px;
  height: 58px;
  overflow: visible;
  transform: translate3d(-8px, 22px, 0) rotate(0) scale(0.82);
  transform-origin: 35% 72%;
}

.magic-portal-button__peek-animal {
  inset: 0;
  width: 58px;
  height: 58px;
  transform: none;
}
```

Use `translate3d(0, 0, 0) rotate(4deg) scale(1)` for hover and focus-visible.

- [ ] **Step 2: Fit the nocturnal first section**

Make the base `.hero` positioned so its absolute metric rail belongs to section one at every breakpoint. On desktop, top-align the grid, reduce its top padding to `calc(var(--header-h) + 18px)`, compact the copy and controls, cap the heading at 96px, cap the animal at 520px, and keep the metric rail 18px above the hero bottom. At the tablet breakpoint, reduce the top offset to `+20px`, reduce `.hero-copy` top padding, and move the metric rail from `bottom: -84px` to `bottom: 16px` so it remains inside the hero's existing reserved bottom space. At the mobile breakpoint, reduce the top offset to `+18px` and the copy padding to 22px; its existing relative metric layout remains unchanged.

```css
.hero { position: relative; }

@media (min-width: 1001px) {
  .hero { align-items: start; padding-top: calc(var(--header-h) + 18px); }
  .hero-copy { padding-block: 22px 112px; }
  h1 { font-size: clamp(58px, 6.35vw, 96px); }
  .lede { font-size: clamp(16px, 1.3vw, 18px); line-height: 1.55; }
  .actions { margin-top: 26px; }
  .animal-picker { margin-top: 22px; padding-top: 12px; }
  .animal-option { min-height: 42px; }
  .animal { width: min(40vw, 520px); bottom: 1vh; }
  .metric-rail { bottom: 18px; }
}
```

- [ ] **Step 3: Stop painting the rim at giant scales**

Keep `portal-world-open` and `portal-world-close` unchanged. For the decorative rim, fade opening to zero by scale `8` and keep it transparent through scale `30`; start closing transparent at scale `30`, keep it transparent through scale `8`, and reveal it only as it contracts back to scale `2`.

```css
@keyframes portal-rim-open {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.02); }
  8% { opacity: 1; }
  14% { transform: translate(calc(-50% - 7px), calc(-50% + 3px)) scale(0.12); }
  26% { transform: translate(calc(-50% + 8px), calc(-50% - 5px)) scale(0.28); }
  42% { opacity: 1; transform: translate(-50%, -50%) scale(2); }
  48% { opacity: 0; transform: translate(-50%, -50%) scale(8); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(30); }
}

@keyframes portal-rim-close {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(30); }
  52% { opacity: 0; transform: translate(-50%, -50%) scale(8); }
  58% { opacity: 1; transform: translate(-50%, -50%) scale(2); }
  78% { transform: translate(calc(-50% - 6px), calc(-50% + 3px)) scale(0.28); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.02); }
}
```

- [ ] **Step 4: Build and run targeted GREEN verification**

Run:

```bash
npm run build
npm run test:e2e -- http://127.0.0.1:4173/
```

Expected: build succeeds and all portal checks pass in Chromium and WebKit.

### Task 3: Complete regression and quality verification

**Files:**
- Verify only: all changed and generated files

- [ ] **Step 1: Run the full local verification**

```bash
npm run verify
npm audit --audit-level=high
```

Expected: unit/static checks pass and npm reports no high-severity vulnerabilities.

- [ ] **Step 2: Re-run the frame-gap diagnostic**

Record `requestAnimationFrame` timestamps during one standard opening and closing transition at `1440 x 900`. Expected: no repeated 100ms+ gap at the point where the rim grows beyond the viewport; the live `clip-path` still expands and shrinks for the full 700ms.

- [ ] **Step 3: Review the final diff and commit**

```bash
git diff --check
git diff --stat
git status --short
git add docs/superpowers/plans/2026-07-17-portal-polish.md scripts/verify-portal.mjs src/styles.css src/public/new-world/index.html new-world/index.html
git commit -m "fix: polish portal transitions and animal layout"
```

Expected: one conventional commit on `codex/magic-portal-redesign`, with no unrelated files staged.
