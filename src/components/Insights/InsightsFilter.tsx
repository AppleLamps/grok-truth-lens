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
    <div className={cn("flex items-center flex-wrap gap-2", className)} aria-label="Filter insights">
      {OPTIONS.map(o => (
        <Button key={o.key} type="button" size="sm" variant={value.includes(o.key) ? "default" : "outline"} onClick={() => toggle(o.key)} aria-pressed={value.includes(o.key)}>
          {o.label}
        </Button>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={selectAll} disabled={allSelected}>All</Button>
        <Button type="button" size="sm" variant="outline" onClick={clearAll}>None</Button>
      </div>
    </div>
  );
}


