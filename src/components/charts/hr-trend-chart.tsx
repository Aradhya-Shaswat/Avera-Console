"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

interface HrDataPoint {
  timestamp: number;
  bpm: number;
}

interface HrTrendChartProps {
  data: HrDataPoint[];
  height?: number | `${number}%`;
  isSimulated?: boolean;
  className?: string;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function HrTrendChart({ data, height = "100%", className }: HrTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted text-xs font-mono", className)}>
        No telemetry records available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: formatTime(d.timestamp),
    bpm: d.bpm,
    ts: d.timestamp,
  }));

  const sampled = chartData.filter((_, i) => i % 3 === 0);

  return (
    <div className={cn("w-full h-full min-h-0", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={sampled} margin={{ top: 8, right: 8, bottom: 4, left: -20 }}>
          <defs>
            <linearGradient id="hrGradientMinimal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brass)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-brass)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "var(--color-muted)", fontFamily: "monospace" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border-subtle)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={["dataMin - 6", "dataMax + 6"]}
            tick={{ fontSize: 10, fill: "var(--color-muted)", fontFamily: "monospace" }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "2px",
              fontSize: "12px",
              fontFamily: "monospace",
              color: "var(--color-foreground)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            labelStyle={{ color: "var(--color-muted)" }}
            formatter={(value) => [`${value ?? 0} bpm`, "Heart Rate"]}
          />
          <Area
            type="monotone"
            dataKey="bpm"
            stroke="var(--color-brass)"
            strokeWidth={1.5}
            fill="url(#hrGradientMinimal)"
            dot={false}
            activeDot={{ r: 3, fill: "var(--color-brass)", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
