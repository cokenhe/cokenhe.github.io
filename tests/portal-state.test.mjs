import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const modulePath = resolve(testDirectory, "../src/portal-state.mjs");

test("the portal swaps between the classic and nocturnal worlds", async () => {
  assert(existsSync(modulePath), "portal state module should exist");
  const { WORLD, getNextWorld } = await import(pathToFileURL(modulePath));

  assert.equal(getNextWorld(WORLD.CLASSIC), WORLD.NOCTURNAL);
  assert.equal(getNextWorld(WORLD.NOCTURNAL), WORLD.CLASSIC);
});

test("the portal exposes accessible destination labels", async () => {
  assert(existsSync(modulePath), "portal state module should exist");
  const { WORLD, getPortalButtonCopy } = await import(pathToFileURL(modulePath));

  assert.deepEqual(getPortalButtonCopy(WORLD.CLASSIC), {
    shortLabel: "Magic",
    visibleLabel: "New world",
    ariaLabel: "Enter the nocturnal portfolio",
  });
  assert.deepEqual(getPortalButtonCopy(WORLD.NOCTURNAL), {
    shortLabel: "Magic",
    visibleLabel: "Classic world",
    ariaLabel: "Return to the classic portfolio",
  });
});

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
