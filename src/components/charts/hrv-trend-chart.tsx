"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

interface HrvDataPoint {
  date: string;
  rmssd: number;
}

interface HrvTrendChartProps {
  data: HrvDataPoint[];
  baseline?: number;
  height?: number | `${number}%`;
  isSimulated?: boolean;
  className?: string;
}

export function HrvTrendChart({
  data,
  baseline,
  height = "100%",
  className,
}: HrvTrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full text-muted text-xs font-mono",
          className
        )}
      >
        No RMSSD samples recorded
      </div>
    );
  }

  const avg =
    baseline ??
    Math.round(data.reduce((s, d) => s + d.rmssd, 0) / data.length);

  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    rmssd: Math.round(d.rmssd * 10) / 10,
    aboveBaseline: d.rmssd >= avg,
  }));

  return (
    <div className={cn("w-full h-full min-h-0", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 4, left: -20 }}
          barCategoryGap="25%"
        >
          <XAxis
            dataKey="date"
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
            formatter={(value) => [`${value ?? 0} ms`, "RMSSD"]}
          />
          <ReferenceLine
            y={avg}
            stroke="var(--color-muted)"
            strokeDasharray="2 3"
            strokeWidth={1}
          />
          <Bar
            dataKey="rmssd"
            radius={[2, 2, 0, 0]}
            fill="var(--color-sage)"
            opacity={0.85}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
