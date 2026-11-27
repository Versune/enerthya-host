"use client";

/**
 * Route-level error boundary for the dashboard segment.
 *
 * Shows what happened in the panel's own voice, offers a retry, and never
 * prints the raw error message — only the digest Next already logged.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="page__section" role="alert">
      <span className="label">Error</span>
      <h2>This page could not load.</h2>
      <p className="page__lede">
        Nothing was changed. Try again; if it keeps failing, check that the database and the worker
        are reachable.
      </p>
      {error.digest ? <p className="deployment__meta">reference {error.digest}</p> : null}
      <button className="btn" type="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
