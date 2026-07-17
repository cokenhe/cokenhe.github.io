import { getNextWorld, getPortalButtonCopy } from "../portal-state.mjs";

function MagicPortalButton({ busy, buttonRef, destinationReady = true, onActivate, variant, world }) {
  const copy = getPortalButtonCopy(world);
  const destination = getNextWorld(world);
  const isPreparing = !destinationReady;
  const isDisabled = busy || isPreparing;

  return (
    <button
      className={`magic-portal-button magic-portal-button--${variant}`}
      ref={buttonRef}
      type="button"
      aria-controls="new-world-frame"
      aria-label={isPreparing ? "Preparing the nocturnal portfolio" : copy.ariaLabel}
      aria-busy={busy || isPreparing}
      data-od-id="magic-portal-toggle"
      data-ready={destinationReady}
      data-world-target={destination}
      disabled={isDisabled}
      onClick={onActivate}
    >
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
      <span className="magic-portal-button__halo" aria-hidden="true" />
      <span className="magic-portal-button__spark magic-portal-button__spark--one" aria-hidden="true">✦</span>
      <span className="magic-portal-button__spark magic-portal-button__spark--two" aria-hidden="true">✧</span>
      <span className="magic-portal-button__spark magic-portal-button__spark--three" aria-hidden="true">✦</span>
      <span className="magic-portal-button__wand" aria-hidden="true">✦</span>
      <span className="magic-portal-button__label">{isPreparing ? "Preparing…" : copy.visibleLabel}</span>
      <span className="magic-portal-button__label-short">{isPreparing ? "Wait" : copy.shortLabel}</span>
    </button>
  );
}

export default MagicPortalButton;
