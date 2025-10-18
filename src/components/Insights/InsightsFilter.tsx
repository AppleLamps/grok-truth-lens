import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type InsightType = "biases_removed" | "context_added" | "corrections" | "narratives_challenged";

interface InsightsFilterProps {
  value: InsightType[];
  onChange: (next: InsightType[]) => void;
  className?: string;
}

const OPTIONS: { key: InsightType; label: string }[] = [
  { key: "biases_removed", label: "Biases" },
  { key: "context_added", label: "Context" },
  { key: "corrections", label: "Corrections" },
  { key: "narratives_challenged", label: "Narratives" },
];

export default function InsightsFilter({ value, onChange, className }: InsightsFilterProps) {
  const toggle = (k: InsightType) => {
    if (value.includes(k)) onChange(value.filter(v => v !== k));
    else onChange([...value, k]);
  };
  const allSelected = value.length === OPTIONS.length;
  const selectAll = () => onChange(OPTIONS.map(o => o.key));
  const clearAll = () => onChange([]);

  return (
    <div className={cn("space-y-2", className)} aria-label="Filter insights">
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(o => (
          <Button
            key={o.key}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => toggle(o.key)}
            aria-pressed={value.includes(o.key)}
            className={cn(
              "h-9 px-3 text-xs font-medium border-2 rounded transition-all",
              value.includes(o.key)
                ? "bg-white text-[#0645ad] border-[#0645ad] hover:bg-[#f8f9fa] shadow-sm"
                : "bg-white text-[#54595d] border-[#c8ccd1] hover:border-[#a2a9b1] hover:text-[#202122]"
            )}
          >
            {o.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={selectAll}
          disabled={allSelected}
          className="h-8 px-3 text-xs border border-[#a2a9b1] bg-[#f8f9fa] hover:bg-white disabled:opacity-40 rounded"
        >
          All
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={clearAll}
          className="h-8 px-3 text-xs border border-[#a2a9b1] bg-[#f8f9fa] hover:bg-white rounded"
        >
          None
        </Button>
      </div>
    </div>
  );
}


