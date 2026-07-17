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

export default PortalTransition;
