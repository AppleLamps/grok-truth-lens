import { useMemo, useCallback, memo } from "react";
import InsightsFilter, { InsightType } from "@/components/Insights/InsightsFilter";

interface InsightsPanelProps {
  insights: any;
  filters: InsightType[];
  onFiltersChange: (filters: InsightType[]) => void;
  onOpenDialog: (type: string) => void;
  isLoading: boolean;
}

const InsightItem = memo(
  ({
    items,
    type,
    color,
    onOpenDialog,
    isLoading,
  }: {
    items: string[];
    type: string;
    color: string;
    onOpenDialog: (type: string) => void;
    isLoading: boolean;
  }) => {
    const borderColor = {
      biases_removed: "border-[#d33]",
      context_added: "border-[#0645ad]",
      corrections: "border-[#b8860b]",
      narratives_challenged: "border-[#f60]",
    }[type] || "border-gray-300";

    const textColor = {
      biases_removed: "text-[#d33]",
      context_added: "text-[#0645ad]",
      corrections: "text-[#b8860b]",
      narratives_challenged: "text-[#f60]",
    }[type] || "text-gray-600";

    const label = {
      biases_removed: "Biases Removed",
      context_added: "Context Added",
      corrections: "Corrections Made",
      narratives_challenged: "Narratives Challenged",
    }[type] || "Unknown";

    return (
      <div className={`border-l-2 ${borderColor} pl-2`}>
        <button
          onClick={() => items.length > 0 && onOpenDialog(type)}
          className={`w-full text-left group ${items.length > 0 ? "cursor-pointer hover:opacity-75" : "cursor-default"
            }`}
        >
          <h4 className="font-semibold text-xs mb-1.5 text-[#202122] flex items-center justify-between">
            {label}
            {items.length > 5 && (
              <span className="text-[#0645ad] text-xs font-normal group-hover:underline">
                View All
              </span>
            )}
          </h4>
        </button>
        {items.length > 0 ? (
          <ul className="space-y-1 text-xs text-[#54595d]">
            {items.slice(0, 5).map((item: string, i: number) => (
              <li
                key={i}
                className="flex gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300"
              >
                <span className={`${textColor} flex-shrink-0`}>•</span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
            {items.length > 5 && (
              <li className="text-[#54595d] italic">+{items.length - 5} more...</li>
            )}
          </ul>
        ) : isLoading ? (
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-1.5 animate-pulse">
                <span className={`${textColor} flex-shrink-0`}>•</span>
                <div className="flex-1 h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]"></div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#72777d] italic">None detected</p>
        )}
      </div>
    );
  }
);

InsightItem.displayName = "InsightItem";

const InsightsPanel = memo(
  ({
    insights,
    filters,
    onFiltersChange,
    onOpenDialog,
    isLoading,
  }: InsightsPanelProps) => {
    const stats = useMemo(
      () => ({
        biases: insights?.biases_removed?.length || 0,
        context: insights?.context_added?.length || 0,
        corrections: insights?.corrections?.length || 0,
        narratives: insights?.narratives_challenged?.length || 0,
      }),
      [insights]
    );

    // Calculate overall truth score (0-100)
    const truthScore = useMemo(() => {
      if (!insights) return 0;
      const total = stats.biases + stats.context + stats.corrections + stats.narratives;
      // Higher score means more improvements made
      // Cap at 100, with each improvement worth points
      const score = Math.min(100, Math.round((total * 5) + 50));
      return score;
    }, [insights, stats]);

    const handleFilterChange = useCallback(
      (newFilters: InsightType[]) => {
        onFiltersChange(newFilters);
      },
      [onFiltersChange]
    );

    return (
      <div className="bg-white border border-[#a2a9b1] rounded-lg overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#eaecf0] to-[#f6f6f6] px-4 py-3 border-b border-[#a2a9b1]">
          <h3 className="text-sm font-bold text-[#202122] tracking-wide">
            Truth Analysis
          </h3>
        </div>

        {/* Content */}
        <div className="p-3">
          {insights ? (
            <div className="space-y-4 text-sm">
              {/* Overall Truth Score */}
              <div className="bg-gradient-to-br from-[#f8f9fa] to-white border border-[#a2a9b1] rounded-lg p-4 text-center">
                <div className="text-xs font-semibold text-[#54595d] mb-2 uppercase tracking-wide">
                  Overall Truth Score
                </div>
                <div className="text-4xl font-bold text-[#0645ad] mb-2">
                  {truthScore}
                  <span className="text-lg text-[#72777d]">/100</span>
                </div>
                <div className="w-full bg-[#eaecf0] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0645ad] to-[#0b5cb5] transition-all duration-500 rounded-full"
                    style={{ width: `${truthScore}%` }}
                  />
                </div>
                <p className="text-xs text-[#54595d] mt-2">
                  {truthScore >= 80 ? "Excellent" : truthScore >= 60 ? "Good" : truthScore >= 40 ? "Fair" : "Needs Review"}
                </p>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
                  <div className="font-bold text-2xl text-[#d33] mb-1">
                    {stats.biases}
                  </div>
                  <div className="text-[#54595d] text-xs font-medium">Biases</div>
                </div>
                <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
                  <div className="font-bold text-2xl text-[#0645ad] mb-1">
                    {stats.context}
                  </div>
                  <div className="text-[#54595d] text-xs font-medium">Context</div>
                </div>
                <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
                  <div className="font-bold text-2xl text-[#b8860b] mb-1">
                    {stats.corrections}
                  </div>
                  <div className="text-[#54595d] text-xs font-medium">
                    Corrections
                  </div>
                </div>
                <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
                  <div className="font-bold text-2xl text-[#f60] mb-1">
                    {stats.narratives}
                  </div>
                  <div className="text-[#54595d] text-xs font-medium">
                    Narratives
                  </div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="pt-2">
                <InsightsFilter value={filters} onChange={handleFilterChange} />
              </div>

              {/* Insight Items */}
              <div className="space-y-3">
                {filters.includes("biases_removed") && (
                  <InsightItem
                    items={insights.biases_removed || []}
                    type="biases_removed"
                    color="#d33"
                    onOpenDialog={onOpenDialog}
                    isLoading={isLoading}
                  />
                )}
                {filters.includes("context_added") && (
                  <InsightItem
                    items={insights.context_added || []}
                    type="context_added"
                    color="#0645ad"
                    onOpenDialog={onOpenDialog}
                    isLoading={isLoading}
                  />
                )}
                {filters.includes("corrections") && (
                  <InsightItem
                    items={insights.corrections || []}
                    type="corrections"
                    color="#b8860b"
                    onOpenDialog={onOpenDialog}
                    isLoading={isLoading}
                  />
                )}
                {filters.includes("narratives_challenged") && (
                  <InsightItem
                    items={insights.narratives_challenged || []}
                    type="narratives_challenged"
                    color="#f60"
                    onOpenDialog={onOpenDialog}
                    isLoading={isLoading}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground italic text-xs py-4 text-center">
              Analyzing content...
            </div>
          )}
        </div>
      </div>
    );
  }
);

InsightsPanel.displayName = "InsightsPanel";

export default InsightsPanel;

