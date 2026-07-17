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

test("the portal completes each world swap atomically at full cover", async () => {
  assert(existsSync(modulePath), "portal state module should exist");
  const { getPortalTiming } = await import(pathToFileURL(modulePath));

  const standard = getPortalTiming(false);
  const reduced = getPortalTiming(true);

  assert.deepEqual(standard, { swapMs: 680 });
  assert.deepEqual(reduced, { swapMs: 120 });
  assert(reduced.swapMs < standard.swapMs);
});
