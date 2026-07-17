# Live Portal Reveal Design

**Date:** 2026-07-17

**Branch:** `codex/magic-portal-redesign`

**Status:** Approved for implementation

## Objective

Enhance the existing magic portal without changing either portfolio's visual design:

1. Make a golden-retriever head peek from behind the original page's magic button on hover or keyboard focus and look toward the button.
2. Remove the perceptible pause at the end of the original-to-animal transition.
3. Turn the expanding circle into a real reveal mask so the live animal page is visible inside the circle as it grows.
4. Return to the original page by shrinking the animal world into the portal, exposing the original page underneath.

## Chosen Approach

Keep both portfolio worlds mounted as composited layers and animate the animal layer's CSS `clip-path`.

- The classic React portfolio is the persistent lower layer.
- The existing same-origin iframe remains the persistent upper layer.
- While the classic world is active, the iframe is clipped to a zero-radius circle and cannot receive pointer or keyboard input.
- Entering the animal world animates that circle from the centre to a radius large enough to cover the viewport.
- Returning animates the same circle from full coverage back to zero.
- Decorative rings, glow, shake, and particles sit around the clipping boundary; they do not fill the portal or obscure its content.

This makes the destination content inside the portal the real, live page. It also avoids the current end hitch because the iframe is paint-ready and kept on a stable rendering layer before the transition begins rather than becoming visible on the last frame.

### Destination readiness

The existing iframe `load` event is not a sufficient ready signal because child scripts, image decoding, and the nested liquid background can continue after it fires. The same-origin animal page will therefore send a parent-window readiness message only after:

- its initial synchronous setup has completed;
- the default dog image has decoded or failed gracefully;
- the nested liquid-background document has loaded or reached a bounded fallback; and
- two animation frames have elapsed so initial layout and paint can settle.

The classic button remains in its existing preparing state until that handshake arrives. The parent validates the message source and same-origin target before accepting it. The iframe stays clipped, rather than `visibility: hidden`, after readiness so activating the portal does not introduce a final-frame visibility change.

## Interaction Design

### Button hover and focus

- The classic navigation button owns a decorative golden-retriever peek element.
- The animal begins fully concealed below and behind the button.
- On `:hover` or `:focus-visible`, the head rises from behind the pill, settles with a small tilt, and looks toward the button centre.
- The peek does not change the button hit area and uses `pointer-events: none`.
- The decoration is `aria-hidden` and the button's existing accessible name remains authoritative.
- On devices without hover, the hover trigger is omitted to avoid a stuck state; `:focus-visible` continues to reveal the peek for an attached keyboard.
- With reduced motion enabled, the head uses a short opacity/position change without bounce or continuous movement.

The first version deliberately uses the animal world's default golden retriever. It does not synchronize with the iframe's species selector.

### Enter animal world

1. The iframe has completed the child readiness handshake and is held at `clip-path: circle(0)` on a stable layer.
2. Activating the button locks repeated activation and marks the destination layer as transitioning.
3. The clipping circle trembles around the viewport centre for the opening beats while its radius expands.
4. The live animal page is visible inside the circle throughout the reveal.
5. A glow/rim and particles track the portal visually without covering the destination.
6. At full viewport coverage, the state commits to the animal world, input moves to the iframe, and focus is restored to the animal world's portal control.

No visibility or mounting change occurs at the final frame, so there is no late paint or blank pause.

### Return to classic world

1. The classic page is already rendered underneath the iframe.
2. Activating the animal-world control disables repeat activation.
3. The animal layer's clipping circle shrinks toward the viewport centre with the portal rim following it.
4. The classic page is progressively exposed outside the shrinking circle.
5. Once the radius reaches zero, the iframe becomes non-interactive and focus returns to the classic magic button.

## State Model

The portal uses explicit phases instead of a single delayed world swap:

- `classic-idle`: classic is interactive; animal layer is clipped closed.
- `opening`: both layers are rendered; animal clip expands; controls are locked.
- `nocturnal-idle`: animal layer fully covers the viewport and is interactive.
- `closing`: both layers are rendered; animal clip contracts; controls are locked.

The settled world is derived from the phase. Transition completion changes interaction and focus state only; it does not reveal or mount destination content.

Animation completion should be driven by the clipping layer's `animationend` event, with a guarded timeout fallback for interrupted or missing events. This keeps React state aligned with the actual visual transition and avoids coupling correctness to a guessed delay.

## Motion

- Standard duration: approximately 700 ms, preserving the current transition's pace.
- Opening: fast initial growth, brief centre jitter, then smooth acceleration to full coverage.
- Closing: reverse spatial path with a controlled contraction rather than simply replaying every particle backward.
- Coverage radius: computed conservatively so the circle clears the farthest viewport corner at all aspect ratios.
- Reduced motion: approximately 120 ms, no shake, no orbiting particles, and a simple circle reveal/contraction.

The implementation will prefer transform/opacity for the decorative elements and limit `clip-path` animation to the one full-screen world layer.

## Component Responsibilities

### `App.jsx`

- Keeps both worlds mounted.
- Owns the four portal phases and activation direction.
- Coordinates iframe readiness, input locking, scroll restoration, and focus restoration.
- Provides transition-completion handlers rather than swapping worlds on one timer.

### `MagicPortalButton.jsx`

- Preserves existing labels, sparkles, variants, and button behaviour.
- Adds the decorative dog peek only for the classic navigation variant.
- Exposes no new interactive element.

### `PortalTransition.jsx`

- Renders only the portal rim, glow, and particle accents.
- Reflects opening/closing phase and reduced-motion preference.
- Does not render an opaque centre disc.

### Portal state module

- Defines legal phases, directions, settled worlds, and fallback timing.
- Keeps state-transition logic testable without the browser.

## Accessibility and Input Safety

- Both portal buttons retain descriptive accessible names and busy states.
- The inactive world is removed from sequential focus navigation and pointer interaction.
- During motion, both world layers are treated as unavailable for user input to prevent accidental navigation.
- Focus is restored after the visual transition completes.
- Reduced-motion preferences disable shaking and simplify the animal peek.
- Decorative animals and portal effects remain hidden from assistive technology.

For the classic layer, phase-based `inert` and `aria-hidden` are applied to its wrapper whenever it is not interactive. For the iframe layer, the parent combines `tabIndex`, `aria-hidden`, and `pointer-events` with a validated same-origin message that makes the child document inert and blurs any child active element. The child is activated only after opening completes and is deactivated before closing starts. This prevents focus from remaining inside a visually clipped frame.

## Verification

### Unit tests

- Valid phase transitions for opening and closing.
- Settled-world derivation for every phase.
- Repeated activation is ignored while transitioning.
- Standard and reduced-motion fallback timing.

### Browser verification

- The animal iframe does not enable the button until the child readiness handshake, and no `visibility` or mount change occurs when opening completes.
- At an intermediate opening frame, classic content exists outside the circle and live animal content is visible inside it.
- There is no visibility/mount change at opening completion.
- At an intermediate closing frame, the live animal page remains visible inside the shrinking circle while the classic page is exposed outside it.
- Closing finishes with the iframe and its child document non-interactive.
- Hover and keyboard focus reveal the dog without changing button geometry.
- Mobile/touch and reduced-motion media queries produce the intended fallbacks.
- Keyboard focus returns to the correct portal control in both directions.
- Existing classic-page links, scrolling, and animal-page interactions remain functional.

## Risks and Mitigations

- **Large `clip-path` repaint cost:** animate only one fixed layer, keep decoration lightweight, and verify desktop/mobile viewport sizes in Chromium and WebKit/Safari.
- **Iframe input leaking while clipped:** explicitly combine parent-level pointer/focus attributes with same-origin child-document `inert` and blur handling.
- **Readiness signal arriving too early or never:** wait for decoded critical art, background load, and settled animation frames, while using a bounded background fallback so the classic page never remains permanently disabled.
- **Viewport resize during motion:** use a percentage-plus-viewport coverage radius and snap to the correct settled clip after resize.
- **Animation event interruption:** retain a phase-scoped timeout fallback and ignore stale completion callbacks.
- **Animal asset framing:** use the existing dog artwork with a dedicated clipped wrapper so no source asset is modified.

## Non-goals

- Rebuilding or restyling either portfolio world.
- Synchronizing the peek animal with the species selected inside the iframe.
- Replacing the existing animal-world HTML/WebGL implementation with React.
- Adding a new animation library.
