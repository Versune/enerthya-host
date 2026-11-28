const LABELS: Record<string, string> = {
  queued: "Queued",
  pending: "Queued",
  building: "Building",
  running: "Building",
  deploying: "Building",
  ready: "Ready",
  success: "Ready",
  healthy: "Ready",
  failed: "Failed",
  error: "Failed",
  canceled: "Canceled",
  cancelled: "Canceled",
};

/**
 * A state indicator that is legible without colour: the dot encodes waiting
 * (hollow), working (filled, muted) and finished (filled, ink), and the label
 * always spells the state out. Borrowed from a 21st.dev status dot, rebuilt on
 * this system's palette instead of a second one.
 */
export function StatusDot({ status }: { status: string }) {
  const key = status.toLowerCase();
  const label = LABELS[key] ?? status;

  return (
    <span className="status-dot" data-state={key}>
      <span className="status-dot__dot" aria-hidden="true" />
      <span className="status-dot__label">{label}</span>
    </span>
  );
}
