interface StatsSummaryProps {
  insights: any;
}

export default function StatsSummary({ insights }: StatsSummaryProps) {
  const biases = insights?.biases_removed?.length || 0;
  const context = insights?.context_added?.length || 0;
  const corrections = insights?.corrections?.length || 0;
  const narratives = insights?.narratives_challenged?.length || 0;
  const total = biases + context + corrections + narratives;

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
        <div className="font-bold text-2xl text-[#d33] mb-1">{biases}</div>
        <div className="text-[#54595d] font-medium">Biases</div>
      </div>
      <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
        <div className="font-bold text-2xl text-[#0645ad] mb-1">{context}</div>
        <div className="text-[#54595d] font-medium">Context</div>
      </div>
      <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
        <div className="font-bold text-2xl text-[#b8860b] mb-1">{corrections}</div>
        <div className="text-[#54595d] font-medium">Corrections</div>
      </div>
      <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
        <div className="font-bold text-2xl text-[#f60] mb-1">{narratives}</div>
        <div className="text-[#54595d] font-medium">Narratives</div>
      </div>
      <div className="col-span-2 bg-[#f8f9fa] border border-[#a2a9b1] rounded p-3 mt-1 text-center hover:shadow-sm transition-shadow">
        <div className="font-bold text-2xl text-[#202122] mb-1">{total}</div>
        <div className="text-[#54595d] font-medium">Total insights</div>
      </div>
    </div>
  );
}


