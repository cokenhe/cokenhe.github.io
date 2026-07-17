export const WORLD = Object.freeze({
  CLASSIC: "classic",
  NOCTURNAL: "nocturnal",
});

const STANDARD_TIMING = Object.freeze({ swapMs: 680 });
const REDUCED_TIMING = Object.freeze({ swapMs: 120 });

export function getNextWorld(world) {
  if (world === WORLD.CLASSIC) return WORLD.NOCTURNAL;
  if (world === WORLD.NOCTURNAL) return WORLD.CLASSIC;
  throw new TypeError(`Unknown portfolio world: ${world}`);
}

export function getPortalButtonCopy(world) {
  if (world === WORLD.CLASSIC) {
    return {
      shortLabel: "Magic",
      visibleLabel: "New world",
      ariaLabel: "Enter the nocturnal portfolio",
    };
  }

  if (world === WORLD.NOCTURNAL) {
    return {
      shortLabel: "Magic",
      visibleLabel: "Classic world",
      ariaLabel: "Return to the classic portfolio",
    };
  }

  throw new TypeError(`Unknown portfolio world: ${world}`);
}

export function getPortalTiming(shouldReduceMotion) {
  return shouldReduceMotion ? REDUCED_TIMING : STANDARD_TIMING;
}
