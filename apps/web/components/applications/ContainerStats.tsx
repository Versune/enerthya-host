"use client";

import { useCallback, useEffect, useState } from "react";

type Sample = { cpuPercent: number; memoryUsed: number; memoryLimit: number };

function megabytes(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

/** One sample every ten seconds while the section is open. */
export function ContainerStats({ applicationId }: { applicationId: string }) {
  const [sample, setSample] = useState<Sample | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/stats`);
      const body = (await response.json().catch(() => ({}))) as Sample & { error?: string };
      if (!response.ok) {
        setError(body.error ?? `The panel answered ${response.status}.`);
        setSample(null);
        return;
      }
      setError(null);
      setSample(body);
    } catch {
      setError("The panel is unreachable.");
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 10_000);
    return () => clearInterval(timer);
  }, [load]);

  if (error) return <p className="deployment__meta">{error}</p>;
  if (!sample) return <p className="deployment__meta">Reading the container…</p>;

  return (
    <dl className="hook">
      <dt className="label">CPU</dt>
      <dd className="hook__value">{sample.cpuPercent}%</dd>
      <dt className="label">Memory</dt>
      <dd className="hook__value">
        {megabytes(sample.memoryUsed)} of {megabytes(sample.memoryLimit)}
      </dd>
    </dl>
  );
}
