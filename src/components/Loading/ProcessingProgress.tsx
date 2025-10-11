import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";

type Phase = "fetching" | "analyzing" | "rewriting" | "finalizing";

export interface ProcessingProgressProps {
  phase: Phase;
  percent: number; // 0..100
  etaSeconds: number | null; // remaining seconds, null when unknown
  message?: string;
  className?: string;
}

const PHASES: { key: Phase; label: string }[] = [
  { key: "fetching", label: "Scraping" },
  { key: "analyzing", label: "Analyzing" },
  { key: "rewriting", label: "Rewriting" },
  { key: "finalizing", label: "Finalizing" },
];

export function ProcessingProgress({ phase, percent, etaSeconds, message, className }: ProcessingProgressProps) {
  const formattedEta = useMemo(() => {
    if (etaSeconds == null || !isFinite(etaSeconds) || etaSeconds < 0) return null;
    const s = Math.ceil(etaSeconds);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}m ${rs}s`;
  }, [etaSeconds]);

  return (
    <div className={cn("w-full border border-[#a2a9b1] bg-[#f8f9fa] rounded px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-3 mb-2 text-sm text-[#54595d]">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span className="font-medium">Processing</span>
        </div>
        <div className="flex items-center gap-2 tabular-nums">
          <span aria-live="polite">{Math.round(percent)}%</span>
          {formattedEta && <span className="text-xs text-muted-foreground">ETA ~{formattedEta}</span>}
        </div>
      </div>

      <Progress value={Math.max(0, Math.min(100, percent))} aria-label="Processing progress" />

      <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Processing phases">
        {PHASES.map((p, idx) => {
          const isActive = p.key === phase;
          const isCompleted = PHASES.findIndex(ph => ph.key === phase) > idx;
          return (
            <div key={p.key} className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded border", isActive && "bg-white border-[#a2a9b1]", !isActive && !isCompleted && "opacity-70 border-transparent", isCompleted && "bg-white border-[#a2a9b1]")}
                 aria-current={isActive ? "step" : undefined}>
              <span className={cn("inline-flex h-2 w-2 rounded-full", isCompleted && "bg-[#0645ad]", isActive && "bg-[#0645ad] animate-pulse", !isActive && !isCompleted && "bg-[#a2a9b1]")}></span>
              <span>{p.label}</span>
            </div>
          );
        })}
      </div>

      {message && (
        <div className="mt-2 text-xs text-[#54595d]" aria-live="polite">{message}</div>
      )}
    </div>
  );
}

export default ProcessingProgress;


