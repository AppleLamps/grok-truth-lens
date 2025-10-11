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
    <div className="grid grid-cols-2 gap-2 text-center text-xs">
      <div className="bg-white border border-[#a2a9b1] rounded p-2"><div className="font-semibold text-base">{biases}</div><div>Biases</div></div>
      <div className="bg-white border border-[#a2a9b1] rounded p-2"><div className="font-semibold text-base">{context}</div><div>Context</div></div>
      <div className="bg-white border border-[#a2a9b1] rounded p-2"><div className="font-semibold text-base">{corrections}</div><div>Corrections</div></div>
      <div className="bg-white border border-[#a2a9b1] rounded p-2"><div className="font-semibold text-base">{narratives}</div><div>Narratives</div></div>
      <div className="col-span-2 bg-[#eaecf0] border border-[#a2a9b1] rounded p-2 mt-1"><div className="font-semibold">{total}</div><div>Total insights</div></div>
    </div>
  );
}


