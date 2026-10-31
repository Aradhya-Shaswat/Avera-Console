"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

type TrendDirection = "up" | "down" | "neutral" | "unknown";

interface MetricReadoutProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: TrendDirection;
  trendValue?: string;
  quality?: "excellent" | "good" | "fair" | "poor" | "invalid";
  isEstimate?: boolean;
  accentColor?: string;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  children?: React.ReactNode;
}

const trendColors: Record<TrendDirection, string> = {
  up: "text-quality-good",
  down: "text-quality-poor",
  neutral: "text-muted",
  unknown: "text-muted",
};

export function MetricCard(props: MetricReadoutProps) {
  return <MetricReadout {...props} />;
}

export function MetricReadout({
  label,
  value,
  unit,
  trend,
  trendValue,
  quality,
  isEstimate,
  accentColor,
  size = "md",
  className,
  children,
}: MetricReadoutProps) {
  const valueSizes = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl lg:text-4xl",
    lg: "text-3xl md:text-4xl lg:text-5xl",
    hero: "text-6xl md:text-7xl lg:text-8xl",
  };

  return (
    <div className={cn("flex flex-col justify-between p-3 md:p-4 overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-muted font-mono font-medium truncate">
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {isEstimate && (
            <span className="text-[10px] font-mono tracking-widest uppercase text-muted/70">
              [EST]
            </span>
          )}
          {quality && (
            <span
              className={cn(
                "h-2 w-2 rounded-full shrink-0",
                quality === "excellent" || quality === "good"
                  ? "bg-quality-good"
                  : quality === "fair"
                  ? "bg-quality-fair"
                  : quality === "poor"
                  ? "bg-quality-poor"
                  : "bg-muted"
              )}
              title={`Quality: ${quality}`}
            />
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 my-0.5">
        <span
          className={cn(
            "font-numeric font-light tracking-tight leading-none text-foreground",
            valueSizes[size],
            value === "—" && "text-muted/50",
            accentColor
          )}
        >
          {value}
        </span>
        {unit && value !== "—" && (
          <span className="text-xs md:text-sm text-muted font-mono font-normal">
            {unit}
          </span>
        )}
      </div>

      {(trend || trendValue) && (
        <div
          className={cn(
            "flex items-center gap-1 text-[11px] md:text-xs font-mono mt-1",
            trend ? trendColors[trend] : "text-muted"
          )}
        >
          {trend === "up" && <ArrowUpRight className="h-3 w-3 shrink-0" />}
          {trend === "down" && <ArrowDownRight className="h-3 w-3 shrink-0" />}
          {trend === "neutral" && <Minus className="h-3 w-3 shrink-0" />}
          {trendValue && <span className="truncate">{trendValue}</span>}
        </div>
      )}

      {children}
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}

export function MetricRow({ label, value, unit, className }: MetricRowProps) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between py-1.5 border-b border-border-subtle text-xs md:text-sm font-mono",
        className
      )}
    >
      <span className="text-muted tracking-wide truncate">{label}</span>
      <div className="flex items-baseline gap-1.5 shrink-0">
        <span className="font-numeric font-medium text-foreground">{value}</span>
        {unit && <span className="text-[11px] text-muted">{unit}</span>}
      </div>
    </div>
  );
}
