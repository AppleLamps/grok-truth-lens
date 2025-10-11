import { useEffect, useState } from "react";

const KEY = 'grokipedia-analytics';

export interface AnalyticsData {
  articlesProcessed: number;
  totalBiases: number;
  totalContext: number;
  totalCorrections: number;
  totalNarratives: number;
  lastProcessedAt?: number;
}

function load(): AnalyticsData {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {} as AnalyticsData; }
}
function save(d: AnalyticsData) { localStorage.setItem(KEY, JSON.stringify(d)); }

export default function useLocalAnalytics() {
  const [data, setData] = useState<AnalyticsData>(() => ({
    articlesProcessed: 0,
    totalBiases: 0,
    totalContext: 0,
    totalCorrections: 0,
    totalNarratives: 0,
  }));

  useEffect(() => {
    const d = load();
    setData({
      articlesProcessed: d.articlesProcessed || 0,
      totalBiases: d.totalBiases || 0,
      totalContext: d.totalContext || 0,
      totalCorrections: d.totalCorrections || 0,
      totalNarratives: d.totalNarratives || 0,
      lastProcessedAt: d.lastProcessedAt,
    });
  }, []);

  const recordArticle = (counts: { biases?: number; context?: number; corrections?: number; narratives?: number; }) => {
    setData((prev) => {
      const next: AnalyticsData = {
        articlesProcessed: (prev.articlesProcessed || 0) + 1,
        totalBiases: (prev.totalBiases || 0) + (counts.biases || 0),
        totalContext: (prev.totalContext || 0) + (counts.context || 0),
        totalCorrections: (prev.totalCorrections || 0) + (counts.corrections || 0),
        totalNarratives: (prev.totalNarratives || 0) + (counts.narratives || 0),
        lastProcessedAt: Date.now(),
      };
      save(next); return next;
    });
  };

  return { data, recordArticle };
}


