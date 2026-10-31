import { cn } from "@/lib/utils";
import type { SignalQuality } from "@/lib/contracts/measurement";

interface SimBadgeProps {
  className?: string;
}

export function SimBadge({ className }: SimBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono tracking-widest uppercase",
        "text-accent/90 border border-accent/30 bg-accent/5",
        className
      )}
      title="Deterministic Synthetic Data"
    >
      SIM
    </span>
  );
}

interface QualityDotProps {
  quality: SignalQuality;
  className?: string;
}

const qualityColors: Record<SignalQuality, string> = {
  excellent: "bg-quality-good",
  good: "bg-quality-good",
  fair: "bg-quality-fair",
  poor: "bg-quality-poor",
  invalid: "bg-muted",
};

export function QualityDot({ quality, className }: QualityDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full shrink-0",
        qualityColors[quality],
        className
      )}
      title={`Signal Quality: ${quality}`}
    />
  );
}

interface ExperimentalBadgeProps {
  className?: string;
}

export function ExperimentalBadge({ className }: ExperimentalBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1 py-0.2 rounded text-[9px] font-mono tracking-widest uppercase",
        "text-muted border border-border-subtle",
        className
      )}
      title="Algorithmic Estimate"
    >
      EST
    </span>
  );
}
