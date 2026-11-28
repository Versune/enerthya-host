/**
 * Route-level loading state for the dashboard segment.
 *
 * Static blocks only — no shimmer — so nothing moves and reduced-motion users
 * get the same screen. Announced politely so a screen reader knows the page is
 * still arriving.
 */
export default function DashboardLoading() {
  return (
    <div className="page__section" aria-busy="true" aria-live="polite">
      <span className="label">Loading</span>
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line skeleton--line-short" />
      <div className="skeleton skeleton--block" />
    </div>
  );
}
