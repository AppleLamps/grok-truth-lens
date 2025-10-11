import useLocalAnalytics from "@/hooks/useLocalAnalytics";

export default function Analytics() {
  const { data } = useLocalAnalytics();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#a2a9b1] rounded p-4">
          <div className="text-sm text-muted-foreground">Articles Processed</div>
          <div className="text-2xl font-semibold">{data.articlesProcessed || 0}</div>
        </div>
        <div className="bg-white border border-[#a2a9b1] rounded p-4">
          <div className="text-sm text-muted-foreground">Biases Removed</div>
          <div className="text-2xl font-semibold">{data.totalBiases || 0}</div>
        </div>
        <div className="bg-white border border-[#a2a9b1] rounded p-4">
          <div className="text-sm text-muted-foreground">Context Added</div>
          <div className="text-2xl font-semibold">{data.totalContext || 0}</div>
        </div>
        <div className="bg-white border border-[#a2a9b1] rounded p-4">
          <div className="text-sm text-muted-foreground">Corrections</div>
          <div className="text-2xl font-semibold">{data.totalCorrections || 0}</div>
        </div>
        <div className="bg-white border border-[#a2a9b1] rounded p-4">
          <div className="text-sm text-muted-foreground">Narratives Challenged</div>
          <div className="text-2xl font-semibold">{data.totalNarratives || 0}</div>
        </div>
      </div>
    </div>
  );
}


