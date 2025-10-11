import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Download, History, Trash2, Columns } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarMenuAction,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProcessingProgress from "@/components/Loading/ProcessingProgress";
import ReadingProgress from "@/components/Article/ReadingProgress";
import TableOfContents from "@/components/Article/TableOfContents";
import TTSControls from "@/components/Article/TTSControls";
import FontSizeControls from "@/components/Article/FontSizeControls";
import ThemeToggle from "@/components/Theme/ThemeToggle";
import BookmarkButton from "@/components/Actions/BookmarkButton";
import ShareButton from "@/components/Actions/ShareButton";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import DiffView from "@/components/Compare/DiffView";
import InsightsFilter, { InsightType } from "@/components/Insights/InsightsFilter";
import useLocalAnalytics from "@/hooks/useLocalAnalytics";

interface SearchHistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
}

const Index = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState("");
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState("");
  const [processingStage, setProcessingStage] = useState<string>("");
  // Progress tracking
  type Phase = "fetching" | "analyzing" | "rewriting" | "finalizing";
  const [phase, setPhase] = useState<Phase>("fetching");
  const [percent, setPercent] = useState<number>(0);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [expectedTotalChars, setExpectedTotalChars] = useState<number | null>(null);
  const [receivedChars, setReceivedChars] = useState<number>(0);
  const speedWindowRef = useRef<{ t: number; n: number }[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const articleRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [filters, setFilters] = useState<InsightType[]>(["biases_removed","context_added","corrections","narratives_challenged"]);
  const { recordArticle } = useLocalAnalytics();

  // Load search history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('grokipedia-search-history');
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // Read URL params (shareable)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url');
    const view = params.get('view');
    if (sharedUrl && sharedUrl.includes('wikipedia.org')) {
      setUrl(sharedUrl);
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }, 50);
    }
    if (view === 'compare') setShowCompare(true);
  }, []);

  // Save a search to history
  const addToSearchHistory = (searchUrl: string) => {
    const title = searchUrl.split('/wiki/')[1]?.replace(/_/g, ' ') || 'Wikipedia Article';
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      url: searchUrl,
      title: decodeURIComponent(title),
      timestamp: Date.now(),
    };
    
    // Remove duplicate URLs
    const filtered = searchHistory.filter(item => item.url !== searchUrl);
    const updated = [newItem, ...filtered].slice(0, 50); // Keep last 50 searches
    
    setSearchHistory(updated);
    localStorage.setItem('grokipedia-search-history', JSON.stringify(updated));
  };

  // Delete a search from history
  const deleteFromHistory = (id: string) => {
    const updated = searchHistory.filter(item => item.id !== id);
    setSearchHistory(updated);
    localStorage.setItem('grokipedia-search-history', JSON.stringify(updated));
    toast.success("Removed from history");
  };

  // Load a search from history
  const loadFromHistory = (historyUrl: string) => {
    setUrl(historyUrl);
    // Trigger the search after setting the URL
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  const handleExportPDF = async () => {
    if (!articleRef.current || !rewrittenContent) return;

    setIsExporting(true);
    toast.info("Generating PDF...");

    try {
      // Create a clone of the article for PDF generation
      const element = articleRef.current.cloneNode(true) as HTMLElement;
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.padding = '20mm';
      tempContainer.style.backgroundColor = 'white';
      document.body.appendChild(tempContainer);
      tempContainer.appendChild(element);

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Clean up temporary container
      document.body.removeChild(tempContainer);

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add image to PDF, handling multiple pages
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename from URL or use default
      const articleTitle = url.split('/wiki/')[1]?.replace(/_/g, ' ') || 'Grokipedia-Article';
      pdf.save(`${articleTitle}.pdf`);

      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.includes("wikipedia.org")) {
      toast.error("Please enter a valid Wikipedia URL");
      return;
    }

    setIsLoading(true);
    setShowResults(true);
    setRewrittenContent("");
    setInsights(null);
    setError("");
    setProcessingStage("Fetching article...");
    setPhase("fetching");
    setPercent(5);
    setEtaSeconds(null);
    setExpectedTotalChars(null);
    setReceivedChars(0);
    speedWindowRef.current = [];

    try {
      toast.info("Processing Wikipedia article...");
      
      // Preload Wikipedia summary to estimate size for ETA
      try {
        const title = url.split('/wiki/')[1];
        if (title) {
          const summaryResp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
          if (summaryResp.ok) {
            const summary = await summaryResp.json();
            const baseLen = (summary?.extract as string | undefined)?.length || 1200;
            // Heuristic: rewritten article length ~ 3.5x summary length, clamped
            const estTotal = Math.max(2000, Math.min(28000, Math.floor(baseLen * 3.5)));
            setExpectedTotalChars(estTotal);
          }
        }
      } catch {
        // Ignore failures, ETA will be unknown
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewrite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ url }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to process article');
      }

      const contentType = response.headers.get('content-type');
      
      // Handle cached response (JSON)
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setRewrittenContent(data.rewritten_article);
        setInsights(data.insights);
        setPhase("finalizing");
        setPercent(100);
        setEtaSeconds(0);
        setIsLoading(false);
        addToSearchHistory(url);
        
        // Record analytics
        recordArticle({
          biases: data.insights?.biases_removed?.length || 0,
          context: data.insights?.context_added?.length || 0,
          corrections: data.insights?.corrections?.length || 0,
          narratives: data.insights?.narratives_challenged?.length || 0,
        });
        
        toast.success("Article loaded from cache!");
        return;
      }

      // Handle streaming response (SSE)
      setProcessingStage("Analyzing content...");
      setPhase("analyzing");
      setPercent((prev) => Math.max(prev, 20));
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedJson = ''; // Accumulate raw JSON
      let partialArticle = ''; // Extract article text as we go

      if (!reader) throw new Error('No response body');

      // Helper function to safely extract JSON arrays from partial JSON
      const extractPartialInsights = (jsonStr: string) => {
        try {
          // Try to find the insights object in the partial JSON
          const insightsMatch = jsonStr.match(/"insights"\s*:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
          if (insightsMatch) {
            // Extract individual arrays
            const extractArray = (fieldName: string): string[] => {
              const regex = new RegExp(`"${fieldName}"\\s*:\\s*\\[([^\\]]*)\\]`);
              const match = jsonStr.match(regex);
              if (match) {
                try {
                  // Parse the array content
                  const arrayContent = '[' + match[1] + ']';
                  const parsed = JSON.parse(arrayContent);
                  return parsed;
                } catch {
                  return [];
                }
              }
              return [];
            };

            return {
              biases_removed: extractArray('biases_removed'),
              context_added: extractArray('context_added'),
              corrections: extractArray('corrections'),
              narratives_challenged: extractArray('narratives_challenged'),
            };
          }
        } catch (e) {
          // Silently fail and return empty insights
        }
        return null;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              setProcessingStage("Finalizing...");
              setPhase("finalizing");
              setPercent(100);
              setEtaSeconds(0);
              setIsLoading(false);
              addToSearchHistory(url);
              toast.success("Article rewritten successfully!");
              
              // Parse final accumulated JSON
              try {
                const fullResult = JSON.parse(accumulatedJson);
                setRewrittenContent(fullResult.rewritten_article || partialArticle);
                setInsights(fullResult.insights);
                
                // Record analytics
                recordArticle({
                  biases: fullResult.insights?.biases_removed?.length || 0,
                  context: fullResult.insights?.context_added?.length || 0,
                  corrections: fullResult.insights?.corrections?.length || 0,
                  narratives: fullResult.insights?.narratives_challenged?.length || 0,
                });
              } catch {
                // Use accumulated article as-is if JSON parsing fails
                setRewrittenContent(partialArticle || accumulatedJson);
              }
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedJson += parsed.content;
                
                // Try to extract article text from partial JSON
                // Look for "rewritten_article":"..." pattern
                const articleMatch = accumulatedJson.match(/"rewritten_article"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                if (articleMatch) {
                  // Unescape JSON string
                  try {
                    partialArticle = JSON.parse('"' + articleMatch[1] + '"');
                    setRewrittenContent(partialArticle);
                  } catch {
                    // If unescape fails, keep previous partial
                  }
                }
                
                // Try to extract and update insights progressively
                const partialInsights = extractPartialInsights(accumulatedJson);
                if (partialInsights) {
                  setInsights(partialInsights);
                }
                
                // Update progress metrics
                setPhase((p) => (p === 'analyzing' ? 'rewriting' : p));
                const now = performance.now();
                // Track speed window
                setReceivedChars((prev) => {
                  const next = prev + String(parsed.content).length;
                  speedWindowRef.current.push({ t: now, n: next });
                  // Keep last 6 seconds
                  const cutoff = now - 6000;
                  speedWindowRef.current = speedWindowRef.current.filter(e => e.t >= cutoff);
                  // Compute speed (chars/sec)
                  const first = speedWindowRef.current[0];
                  const last = speedWindowRef.current[speedWindowRef.current.length - 1];
                  if (first && last && last.t > first.t) {
                    const dn = last.n - first.n;
                    const dt = (last.t - first.t) / 1000;
                    const speed = dn / dt;
                    // Update ETA when we have an estimate and expected size
                    setEtaSeconds((curr) => {
                      const total = expectedTotalChars;
                      if (!total || !isFinite(speed) || speed <= 0) return curr ?? null;
                      const remaining = Math.max(0, total - next);
                      return remaining / speed;
                    });
                  }
                  // Percent calculation with phase weights
                  const total = expectedTotalChars;
                  let pct: number;
                  if (total && total > 0) {
                    const frac = Math.max(0, Math.min(1, next / total));
                    // Weights: fetching 10, analyzing 20, rewriting 65, finalizing 5
                    const base = 30; // after analyze
                    pct = 10 + 20 + Math.min(65, Math.round(65 * frac));
                    if (phase === 'fetching') pct = 10;
                    if (phase === 'analyzing') pct = 30;
                  } else {
                    // Fallback: logarithmic ramp up to 95%
                    const frac = Math.min(1, Math.log10(1 + next / 1500));
                    pct = Math.min(95, Math.round(30 + 65 * frac));
                  }
                  setPercent((prevPct) => Math.max(prevPct, pct));
                  return next;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }

    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process article';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
      setProcessingStage("");
    }
  };

  // Pull-to-refresh on mobile
  usePullToRefresh(articleRef as unknown as React.RefObject<HTMLElement>, () => {
    if (url && !isLoading && formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  }, { threshold: 80 });

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Group search history by time periods
  const groupedHistory = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    const groups = {
      today: [] as SearchHistoryItem[],
      yesterday: [] as SearchHistoryItem[],
      thisWeek: [] as SearchHistoryItem[],
      older: [] as SearchHistoryItem[],
    };

    searchHistory.forEach((item) => {
      const diff = now - item.timestamp;
      if (diff < oneDay) {
        groups.today.push(item);
      } else if (diff < 2 * oneDay) {
        groups.yesterday.push(item);
      } else if (diff < oneWeek) {
        groups.thisWeek.push(item);
      } else {
        groups.older.push(item);
      }
    });

    return groups;
  }, [searchHistory]);

  const clearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all search history?')) {
      setSearchHistory([]);
      localStorage.removeItem('grokipedia-search-history');
      toast.success("Search history cleared");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="border-b border-[#a2a9b1] bg-gradient-to-br from-[#f8f9fa] to-[#eaecf0] shadow-sm">
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white rounded-md border border-[#a2a9b1] shadow-sm">
                <History className="h-4 w-4 text-[#0645ad]" />
              </div>
              <h2 className="font-bold text-base text-[#202122] tracking-tight">Search History</h2>
            </div>
            {searchHistory.length > 0 && (
              <Button
                onClick={clearAllHistory}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-[#d33] hover:text-[#d33] hover:bg-red-50"
                title="Clear all history"
              >
                Clear All
              </Button>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-gradient-to-b from-white to-[#f8f9fa]">
          <ScrollArea className="h-[calc(100vh-80px)]">
            {searchHistory.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#f8f9fa] to-[#eaecf0] border border-[#a2a9b1] shadow-sm mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#54595d]">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#202122] mb-1">No History Yet</p>
                <p className="text-xs text-[#54595d] leading-relaxed">
                  Your searched articles will<br />appear here for quick access.
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-4">
                {/* Today */}
                {groupedHistory.today.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-bold text-[#54595d] uppercase tracking-wider mb-2 px-2">
                      Today
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <div className="space-y-1.5">
                        {groupedHistory.today.map((item) => (
                          <div
                            key={item.id}
                            className="group relative bg-white border border-[#c8ccd1] rounded-lg hover:border-[#0645ad] hover:shadow-md transition-all duration-200 overflow-hidden"
                          >
                            <button
                              onClick={() => loadFromHistory(item.url)}
                              className="w-full text-left p-3 pr-10"
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0645ad]">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-[#202122] group-hover:text-[#0645ad] transition-colors line-clamp-2 leading-snug mb-1">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-[#54595d] flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    {formatTime(item.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFromHistory(item.id);
                              }}
                              className="absolute right-2 top-2 p-1.5 rounded-md text-[#54595d] hover:text-[#d33] hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              title="Remove from history"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {/* Yesterday */}
                {groupedHistory.yesterday.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-bold text-[#54595d] uppercase tracking-wider mb-2 px-2">
                      Yesterday
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <div className="space-y-1.5">
                        {groupedHistory.yesterday.map((item) => (
                          <div
                            key={item.id}
                            className="group relative bg-white border border-[#c8ccd1] rounded-lg hover:border-[#0645ad] hover:shadow-md transition-all duration-200 overflow-hidden"
                          >
                            <button
                              onClick={() => loadFromHistory(item.url)}
                              className="w-full text-left p-3 pr-10"
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0645ad]">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-[#202122] group-hover:text-[#0645ad] transition-colors line-clamp-2 leading-snug mb-1">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-[#54595d] flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    {formatTime(item.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFromHistory(item.id);
                              }}
                              className="absolute right-2 top-2 p-1.5 rounded-md text-[#54595d] hover:text-[#d33] hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              title="Remove from history"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {/* This Week */}
                {groupedHistory.thisWeek.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-bold text-[#54595d] uppercase tracking-wider mb-2 px-2">
                      This Week
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <div className="space-y-1.5">
                        {groupedHistory.thisWeek.map((item) => (
                          <div
                            key={item.id}
                            className="group relative bg-white border border-[#c8ccd1] rounded-lg hover:border-[#0645ad] hover:shadow-md transition-all duration-200 overflow-hidden"
                          >
                            <button
                              onClick={() => loadFromHistory(item.url)}
                              className="w-full text-left p-3 pr-10"
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0645ad]">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-[#202122] group-hover:text-[#0645ad] transition-colors line-clamp-2 leading-snug mb-1">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-[#54595d] flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    {formatTime(item.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFromHistory(item.id);
                              }}
                              className="absolute right-2 top-2 p-1.5 rounded-md text-[#54595d] hover:text-[#d33] hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              title="Remove from history"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {/* Older */}
                {groupedHistory.older.length > 0 && (
                  <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-bold text-[#54595d] uppercase tracking-wider mb-2 px-2">
                      Older
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <div className="space-y-1.5">
                        {groupedHistory.older.map((item) => (
                          <div
                            key={item.id}
                            className="group relative bg-white border border-[#c8ccd1] rounded-lg hover:border-[#0645ad] hover:shadow-md transition-all duration-200 overflow-hidden"
                          >
                            <button
                              onClick={() => loadFromHistory(item.url)}
                              className="w-full text-left p-3 pr-10"
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0645ad]">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-[#202122] group-hover:text-[#0645ad] transition-colors line-clamp-2 leading-snug mb-1">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-[#54595d] flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    {formatTime(item.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFromHistory(item.id);
                              }}
                              className="absolute right-2 top-2 p-1.5 rounded-md text-[#54595d] hover:text-[#d33] hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                              title="Remove from history"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}
              </div>
            )}
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="border-b border-border bg-background">
            <div className="mx-auto max-w-7xl px-4 py-6">
              <div className="flex items-center gap-4 mb-4">
                <SidebarTrigger className="h-8 w-8" />
                <div className="flex-1 text-center">
                  <div className="inline-block">
                    <h1 
                      onClick={() => {
                        setShowResults(false);
                        setRewrittenContent("");
                        setInsights(null);
                        setError("");
                        setUrl("");
                        setShowCompare(false);
                        window.history.replaceState({}, '', '/');
                      }}
                      className="font-serif text-5xl font-bold tracking-tight text-foreground mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setShowResults(false);
                          setRewrittenContent("");
                          setInsights(null);
                          setError("");
                          setUrl("");
                          setShowCompare(false);
                          window.history.replaceState({}, '', '/');
                        }
                      }}
                      aria-label="Return to home"
                    >
                      GROKIPEDIA
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      The Truth-Seeking Encyclopedia
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      by{" "}
                      <a 
                        href="https://x.com/lamps_apple" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#0645ad] hover:underline font-medium"
                      >
                        @lamps_apple
                      </a>
                    </p>
                  </div>
                </div>
                <div className="w-8"></div> {/* Spacer for centering */}
              </div>
            </div>
          </header>

      {/* Search Section */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#72777d]" />
                <Input
                  type="url"
                  placeholder="Enter Wikipedia URL (e.g., https://en.wikipedia.org/wiki/...)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-12 pl-10 pr-4 border-[#a2a9b1] bg-white text-[#202122] placeholder:text-[#72777d] focus:border-[#0645ad] focus:ring-2 focus:ring-[#0645ad]/20 transition-all shadow-sm"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 px-8 bg-[#0645ad] hover:bg-[#0b5cb5] text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Search"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Progressive Loading Indicator */}
      {isLoading && (
        <div className="mx-auto max-w-4xl px-4 py-2">
          <ProcessingProgress
            phase={phase}
            percent={percent}
            etaSeconds={etaSeconds}
            message={processingStage}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5 text-red-800 shadow-md">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <strong className="font-bold">Error:</strong> <span className="font-medium">{error}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      {showResults && !error && (
        <div className="bg-white">
          <div className="mx-auto max-w-[1400px] px-4 py-6">
            <div className="flex flex-col lg:flex-row gap-6 lg:justify-center">
              {/* Main Article Area */}
              <article className="w-full lg:max-w-[860px]">
                {/* Reading progress */}
                <ReadingProgress targetRef={articleRef as unknown as React.RefObject<HTMLElement>} />
                {/* Article Header Metadata */}
                {rewrittenContent && (
                  <div className="mb-6 pb-4 border-b border-[#a2a9b1] bg-gradient-to-r from-[#f8f9fa]/50 to-transparent rounded-t px-4 py-3 -mx-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-[#54595d]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Rewritten for clarity and neutrality</span>
                        <span className="mx-2 hidden sm:inline">•</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#0645ad] hover:underline hidden sm:inline">
                          View original article
                        </a>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 border border-[#a2a9b1] bg-[#f8f9fa] rounded">
                          <TTSControls targetRef={articleRef as unknown as React.RefObject<HTMLElement>} className="hidden lg:flex" />
                        </div>
                        <div className="flex items-center gap-1 border border-[#a2a9b1] bg-[#f8f9fa] rounded">
                          <FontSizeControls />
                        </div>
                        <div className="border border-[#a2a9b1] bg-[#f8f9fa] rounded">
                          <ThemeToggle />
                        </div>
                        <Button type="button" size="sm" variant="ghost" className="h-8 px-3 text-xs border border-[#a2a9b1] bg-[#f8f9fa] hover:bg-white" onClick={() => setShowCompare((v) => !v)} aria-label="Toggle comparison">
                          <Columns className="h-3.5 w-3.5 mr-1.5" />
                          <span className="hidden sm:inline">Compare</span>
                        </Button>
                        <BookmarkButton url={url} />
                        <ShareButton url={url} view={showCompare ? 'compare' : undefined} />
                        <Button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs border border-[#a2a9b1] bg-[#f8f9fa] hover:bg-white disabled:opacity-50"
                        >
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          <span className="hidden sm:inline">{isExporting ? "Exporting..." : "PDF"}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {rewrittenContent ? (
                  <div className="wikipedia-article" ref={articleRef}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {rewrittenContent}
                    </ReactMarkdown>
                    
                    {/* Wikipedia-style footer note */}
                    <div className="mt-10 pt-6 border-t-2 border-[#a2a9b1]">
                      <div className="text-sm text-[#54595d] bg-gradient-to-br from-[#f8f9fa] to-[#eaecf0] rounded-lg border border-[#a2a9b1] p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0645ad]">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                          </svg>
                          <p className="font-bold text-[#202122]">About Sources</p>
                        </div>
                        <p className="leading-relaxed">
                          This article has been rewritten for clarity and neutrality. 
                          To view the original Wikipedia article with all citations and sources, visit:{" "}
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#0645ad] hover:underline font-semibold break-all"
                          >
                            {url}
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                    <div className="space-y-2 mt-6">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-11/12"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                )}
            </article>

            {/* Sidebar - Analysis (hide when comparing) */}
            {!showCompare && (
            <aside className="lg:w-[320px] w-full lg:sticky lg:top-4 lg:self-start">
              <div className="bg-[#f8f9fa] border border-[#a2a9b1] rounded-lg shadow-md overflow-hidden">
                {/* Table of Contents */}
                <div className="p-3 border-b border-[#a2a9b1]">
                  <TableOfContents targetRef={articleRef as unknown as React.RefObject<HTMLElement>} />
                </div>
                
                {/* Truth Analysis Section */}
                <div className="bg-gradient-to-r from-[#eaecf0] to-[#f6f6f6] px-4 py-3 border-b border-[#a2a9b1]">
                  <h3 className="text-sm font-bold text-[#202122] tracking-wide">
                    Truth Analysis
                  </h3>
                </div>
                <div className="p-3">
                  {insights ? (
                    <div className="space-y-4 text-sm">
                      {/* Compact Stats Summary */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
                          <div className="font-bold text-2xl text-[#d33] mb-1">{(insights?.biases_removed?.length||0)}</div>
                          <div className="text-[#54595d] text-xs font-medium">Biases</div>
                        </div>
                        <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
                          <div className="font-bold text-2xl text-[#0645ad] mb-1">{(insights?.context_added?.length||0)}</div>
                          <div className="text-[#54595d] text-xs font-medium">Context</div>
                        </div>
                        <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
                          <div className="font-bold text-2xl text-[#b8860b] mb-1">{(insights?.corrections?.length||0)}</div>
                          <div className="text-[#54595d] text-xs font-medium">Corrections</div>
                        </div>
                        <div className="bg-white border border-[#a2a9b1] rounded p-3 text-center hover:shadow-sm transition-shadow">
                          <div className="font-bold text-2xl text-[#f60] mb-1">{(insights?.narratives_challenged?.length||0)}</div>
                          <div className="text-[#54595d] text-xs font-medium">Narratives</div>
                        </div>
                      </div>
                      
                      {/* Filter Controls */}
                      <div className="pt-2">
                        <InsightsFilter value={filters} onChange={setFilters} />
                      </div>
                      
                      {/* Compact Lists */}
                      <div className="space-y-3">
                        {/* Biases Removed */}
                        {filters.includes('biases_removed') && (
                          <div className="border-l-2 border-[#d33] pl-2">
                            <h4 className="font-semibold text-xs mb-1.5 text-[#202122]">Biases Removed</h4>
                            {insights.biases_removed && insights.biases_removed.length > 0 ? (
                              <ul className="space-y-1 text-xs text-[#54595d]">
                                {insights.biases_removed.slice(0, 5).map((bias: string, i: number) => (
                                  <li key={i} className="flex gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-[#d33] flex-shrink-0">•</span>
                                    <span className="leading-snug">{bias}</span>
                                  </li>
                                ))}
                                {insights.biases_removed.length > 5 && (
                                  <li className="text-[#54595d] italic">+{insights.biases_removed.length - 5} more...</li>
                                )}
                              </ul>
                            ) : isLoading ? (
                              <div className="space-y-1.5">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex gap-1.5 animate-pulse">
                                    <span className="text-[#d33] flex-shrink-0">•</span>
                                    <div className="flex-1 h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]"></div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-[#72777d] italic">None detected</p>
                            )}
                          </div>
                        )}
                        
                        {/* Context Added */}
                        {filters.includes('context_added') && (
                          <div className="border-l-2 border-[#0645ad] pl-2">
                            <h4 className="font-semibold text-xs mb-1.5 text-[#202122]">Context Added</h4>
                            {insights.context_added && insights.context_added.length > 0 ? (
                              <ul className="space-y-1 text-xs text-[#54595d]">
                                {insights.context_added.slice(0, 5).map((context: string, i: number) => (
                                  <li key={i} className="flex gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-[#0645ad] flex-shrink-0">•</span>
                                    <span className="leading-snug">{context}</span>
                                  </li>
                                ))}
                                {insights.context_added.length > 5 && (
                                  <li className="text-[#54595d] italic">+{insights.context_added.length - 5} more...</li>
                                )}
                              </ul>
                            ) : isLoading ? (
                              <div className="space-y-1.5">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex gap-1.5 animate-pulse">
                                    <span className="text-[#0645ad] flex-shrink-0">•</span>
                                    <div className="flex-1 h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]"></div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-[#72777d] italic">None added</p>
                            )}
                          </div>
                        )}
                        
                        {/* Corrections Made */}
                        {filters.includes('corrections') && (
                          <div className="border-l-2 border-[#b8860b] pl-2">
                            <h4 className="font-semibold text-xs mb-1.5 text-[#202122]">Corrections Made</h4>
                            {insights.corrections && insights.corrections.length > 0 ? (
                              <ul className="space-y-1 text-xs text-[#54595d]">
                                {insights.corrections.slice(0, 5).map((correction: string, i: number) => (
                                  <li key={i} className="flex gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-[#b8860b] flex-shrink-0">•</span>
                                    <span className="leading-snug">{correction}</span>
                                  </li>
                                ))}
                                {insights.corrections.length > 5 && (
                                  <li className="text-[#54595d] italic">+{insights.corrections.length - 5} more...</li>
                                )}
                              </ul>
                            ) : isLoading ? (
                              <div className="space-y-1.5">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex gap-1.5 animate-pulse">
                                    <span className="text-[#b8860b] flex-shrink-0">•</span>
                                    <div className="flex-1 h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]"></div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-[#72777d] italic">None made</p>
                            )}
                          </div>
                        )}
                        
                        {/* Narratives Challenged */}
                        {filters.includes('narratives_challenged') && (
                          <div className="border-l-2 border-[#f60] pl-2">
                            <h4 className="font-semibold text-xs mb-1.5 text-[#202122]">Narratives Challenged</h4>
                            {insights.narratives_challenged && insights.narratives_challenged.length > 0 ? (
                              <ul className="space-y-1 text-xs text-[#54595d]">
                                {insights.narratives_challenged.slice(0, 5).map((narrative: string, i: number) => (
                                  <li key={i} className="flex gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-[#f60] flex-shrink-0">•</span>
                                    <span className="leading-snug">{narrative}</span>
                                  </li>
                                ))}
                                {insights.narratives_challenged.length > 5 && (
                                  <li className="text-[#54595d] italic">+{insights.narratives_challenged.length - 5} more...</li>
                                )}
                              </ul>
                            ) : isLoading ? (
                              <div className="space-y-1.5">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex gap-1.5 animate-pulse">
                                    <span className="text-[#f60] flex-shrink-0">•</span>
                                    <div className="flex-1 h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]"></div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-[#72777d] italic">None challenged</p>
                            )}
                          </div>
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
            </aside>
            )}
            
            {/* Compare View */}
            {showCompare && (
              <div className="flex-1">
                <DiffView originalUrl={url} rewrittenMarkdown={rewrittenContent} />
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Empty State */}
      {!showResults && !error && (
        <div className="mx-auto max-w-4xl px-4 py-24">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-[#f8f9fa] to-[#eaecf0] border-2 border-[#a2a9b1] shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#54595d]">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-serif font-bold text-[#202122]">
                Search for Truth
              </h2>
              <p className="text-[#54595d] text-lg max-w-xl mx-auto leading-relaxed">
                Enter any Wikipedia article URL to see it rewritten with bias removed 
                and context added for a more balanced perspective.
              </p>
            </div>
            <div className="text-sm text-[#54595d] bg-gradient-to-br from-[#f8f9fa] to-white border border-[#a2a9b1] rounded-lg p-5 max-w-xl mx-auto shadow-sm hover:shadow-md transition-shadow">
              <p className="font-semibold mb-2 text-[#202122]">Example:</p>
              <code className="text-[#0645ad] bg-white px-3 py-1.5 rounded border border-[#c8ccd1] inline-block font-mono text-xs">https://en.wikipedia.org/wiki/Elon_Musk</code>
            </div>
          </div>
        </div>
      )}

          {/* Back to Top Button */}
          {showBackToTop && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-8 right-8 bg-white border-2 border-[#a2a9b1] rounded-full p-4 shadow-xl hover:shadow-2xl hover:bg-[#0645ad] hover:border-[#0645ad] hover:scale-110 transition-all duration-300 group z-50"
              aria-label="Back to top"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#54595d] group-hover:text-white transition-colors">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </button>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Index;
