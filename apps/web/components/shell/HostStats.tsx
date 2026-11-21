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

  return (
    <div className="stats">
      <dl className="hook">
        <dt className="label">CPU</dt>
        <dd className="hook__value">
          {data.cpuPercent}% · load {data.loadAverage.toFixed(2)} · {data.cores} cores
        </dd>
        <dt className="label">Memory</dt>
        <dd className="hook__value">
          {gigabytes(data.memoryUsed)} of {gigabytes(data.memoryTotal)}
        </dd>
        <dt className="label">Disk</dt>
        <dd className="hook__value">
          {data.diskPercent}% · {gigabytes(data.diskUsed)} of {gigabytes(data.diskTotal)}
        </dd>
        <dt className="label">Uptime</dt>
        <dd className="hook__value">
          {days(data.uptimeSeconds)} · {data.platform}
        </dd>
      </dl>

      {history.length > 1 ? (
        <div className="stats__chart" role="img" aria-label="Host CPU over the last five minutes">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #d9d9d9",
                  borderRadius: 0,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12,
                }}
                formatter={(value) => [`${value}%`, "CPU"]}
                labelFormatter={(label) => String(label ?? "")}
              />
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="#111111"
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
