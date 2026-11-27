"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

type Sample = {
  cpuPercent: number;
  loadAverage: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsed: number;
  diskTotal: number;
  diskPercent: number;
  uptimeSeconds: number;
  cores: number;
  platform: string;
};

type Point = { at: string; cpu: number };

const HISTORY = 30;

function gigabytes(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function days(seconds: number): string {
  const value = Math.floor(seconds / 86_400);
  return value === 1 ? "1 day" : `${value} days`;
}

function StatCard({
  label,
  value,
  detail,
  percent,
}: {
  label: string;
  value: string;
  detail: string;
  percent?: number;
}) {
  return (
    <div className="stat-card">
      <span className="label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      {typeof percent === "number" ? (
        <div
          className="stat-card__bar"
          role="progressbar"
          aria-label={`${label} usage`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
        >
          <span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
      ) : null}
      <span className="stat-card__detail">{detail}</span>
    </div>
  );
}

/**
 * The machine the worker runs on, polled every ten seconds while the panel is
 * open. Container numbers answer "is the app healthy"; these answer "is the host".
 */
export function HostStats() {
  const { data, error } = useQuery<Sample>({
    queryKey: ["host-stats"],
    queryFn: async () => {
      const response = await fetch("/api/host/stats");
      const body = (await response.json().catch(() => ({}))) as Sample & { error?: string };
      if (!response.ok) throw new Error(body.error ?? `The panel answered ${response.status}.`);
      return body;
    },
    refetchInterval: 10_000,
  });

  const [history, setHistory] = useState<Point[]>([]);

  useEffect(() => {
    if (!data) return;
    const point = {
      at: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      cpu: data.cpuPercent,
    };
    setHistory((current) => [...current, point].slice(-HISTORY));
  }, [data]);

  if (error) return <p className="deployment__meta">{error.message}</p>;
  if (!data) return <p className="deployment__meta">Reading this machine…</p>;

  const memoryPercent = data.memoryTotal > 0 ? (data.memoryUsed / data.memoryTotal) * 100 : 0;

  return (
    <div className="stats">
      <div className="stats-grid">
        <StatCard
          label="CPU"
          value={`${data.cpuPercent}%`}
          detail={`load ${data.loadAverage.toFixed(2)} · ${data.cores} cores`}
          percent={data.cpuPercent}
        />
        <StatCard
          label="Memory"
          value={gigabytes(data.memoryUsed)}
          detail={`of ${gigabytes(data.memoryTotal)}`}
          percent={memoryPercent}
        />
        <StatCard
          label="Disk"
          value={`${data.diskPercent}%`}
          detail={`${gigabytes(data.diskUsed)} of ${gigabytes(data.diskTotal)}`}
          percent={data.diskPercent}
        />
        <StatCard label="Uptime" value={days(data.uptimeSeconds)} detail={data.platform} />
      </div>

      {history.length > 1 ? (
        <div className="stats__chart" role="img" aria-label="Host CPU over the last five minutes">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "var(--paper)",
                  border: "1px solid var(--rule)",
                  borderRadius: 2,
                  color: "var(--ink)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--ink-60)" }}
                itemStyle={{ color: "var(--ink)" }}
                formatter={(value) => [`${value}%`, "CPU"]}
                labelFormatter={(label) => String(label ?? "")}
              />
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="var(--ink)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
