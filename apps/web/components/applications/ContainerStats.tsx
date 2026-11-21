"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

type Sample = { cpuPercent: number; memoryUsed: number; memoryLimit: number };
type Point = { at: string; cpu: number };

/** How many ten-second samples the chart keeps: five minutes of history. */
const HISTORY = 30;

function megabytes(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

/**
 * The container's CPU and memory while the section is open. The current values
 * are polled every ten seconds; the chart keeps the last five minutes, which is
 * enough to see a spike without a time-series store behind it.
 */
export function ContainerStats({ applicationId }: { applicationId: string }) {
  const { data, error } = useQuery<Sample>({
    queryKey: ["container-stats", applicationId],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${applicationId}/stats`);
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
  if (!data) return <p className="deployment__meta">Reading the container…</p>;

  return (
    <div className="stats">
      <dl className="hook">
        <dt className="label">CPU</dt>
        <dd className="hook__value">{data.cpuPercent}%</dd>
        <dt className="label">Memory</dt>
        <dd className="hook__value">
          {megabytes(data.memoryUsed)} of {megabytes(data.memoryLimit)}
        </dd>
      </dl>

      {history.length > 1 ? (
        <div className="stats__chart" role="img" aria-label="CPU over the last five minutes">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <YAxis hide domain={[0, "dataMax + 10"]} />
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
