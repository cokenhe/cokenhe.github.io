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

if (typeof window !== "undefined" && typeof document !== "undefined") {
  initializePortalBridge(window, document);
}
