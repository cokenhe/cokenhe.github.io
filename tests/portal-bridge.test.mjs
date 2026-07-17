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
