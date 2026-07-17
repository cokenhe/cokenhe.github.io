export const WORLD = Object.freeze({
  CLASSIC: "classic",
  NOCTURNAL: "nocturnal",
});

export const PORTAL_PHASE = Object.freeze({
  CLASSIC_IDLE: "classic-idle",
  OPENING: "opening",
  NOCTURNAL_IDLE: "nocturnal-idle",
  CLOSING: "closing",
});

const STANDARD_TIMING = Object.freeze({ durationMs: 700, fallbackMs: 900 });
const REDUCED_TIMING = Object.freeze({ durationMs: 120, fallbackMs: 240 });

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
