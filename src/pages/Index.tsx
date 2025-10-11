import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Download, History, Trash2 } from "lucide-react";
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
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const articleRef = useRef<HTMLDivElement>(null);

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
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
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

    try {
      toast.info("Processing Wikipedia article...");
      
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
        setIsLoading(false);
        addToSearchHistory(url);
        toast.success("Article loaded from cache!");
        return;
      }

      // Handle streaming response (SSE)
      setProcessingStage("Analyzing content...");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      if (!reader) throw new Error('No response body');

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
              setIsLoading(false);
              addToSearchHistory(url);
              toast.success("Article rewritten successfully!");
              
              // Parse final accumulated content for insights
              try {
                const fullResult = JSON.parse(accumulatedContent);
                setRewrittenContent(fullResult.rewritten_article || accumulatedContent);
                setInsights(fullResult.insights);
              } catch {
                // Use accumulated content as-is if not JSON
                setRewrittenContent(accumulatedContent);
              }
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                setRewrittenContent(accumulatedContent);
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

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="border-b border-[#a2a9b1] bg-[#f8f9fa]">
          <div className="flex items-center gap-2 px-2 py-2">
            <History className="h-5 w-5 text-[#54595d]" />
            <h2 className="font-semibold text-[#202122]">Search History</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <ScrollArea className="h-[calc(100vh-80px)]">
                {searchHistory.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-[#54595d]">
                    <p>No search history yet.</p>
                    <p className="mt-2 text-xs">Your searches will appear here.</p>
                  </div>
                ) : (
                  <SidebarMenu>
                    {searchHistory.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => loadFromHistory(item.url)}
                          className="w-full justify-start text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate text-[#202122]">
                              {item.title}
                            </div>
                            <div className="text-xs text-[#54595d] mt-0.5">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </SidebarMenuButton>
                        <SidebarMenuAction
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFromHistory(item.id);
                          }}
                          showOnHover
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </SidebarMenuAction>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                )}
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
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
                  <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground mb-1">
                    GROKIPEDIA
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    The Truth-Seeking Encyclopedia
                  </p>
                </div>
                <div className="w-8"></div> {/* Spacer for centering */}
              </div>
            </div>
          </header>

      {/* Search Section */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="Enter Wikipedia URL (e.g., https://en.wikipedia.org/wiki/...)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-11 pl-10 pr-4 border-border"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 px-6"
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
          <div className="flex items-center gap-3 text-sm text-[#54595d] bg-[#f8f9fa] border border-[#a2a9b1] rounded px-4 py-3">
            <div className="animate-spin h-4 w-4 border-2 border-[#0645ad] border-t-transparent rounded-full"></div>
            <span>{processingStage}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="bg-destructive/10 border-destructive border rounded p-4 text-destructive">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Content Section */}
      {showResults && !error && (
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Article Area */}
            <article className="flex-1 lg:max-w-4xl">
              <div className="bg-white border-l border-[#a2a9b1] pl-8 pr-8 py-6">
                {/* Article Header Metadata */}
                {rewrittenContent && (
                  <div className="mb-6 pb-4 border-b border-[#a2a9b1]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-[#54595d]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Rewritten for clarity and neutrality</span>
                        <span className="mx-2">•</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#0645ad] hover:underline">
                          View original article
                        </a>
                      </div>
                      <Button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-xs h-7"
                      >
                        <Download className="h-3 w-3" />
                        {isExporting ? "Exporting..." : "Export PDF"}
                      </Button>
                    </div>
                  </div>
                )}
                {rewrittenContent ? (
                  <div className="wikipedia-article" ref={articleRef}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {rewrittenContent}
                    </ReactMarkdown>
                    
                    {/* Wikipedia-style footer note */}
                    <div className="mt-8 pt-6 border-t border-[#a2a9b1]">
                      <div className="text-sm text-[#54595d] bg-[#f8f9fa] rounded p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#54595d]">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                          </svg>
                          <p className="font-semibold">About Sources</p>
                        </div>
                        <p>
                          This article has been rewritten for clarity and neutrality. 
                          To view the original Wikipedia article with all citations and sources, visit:{" "}
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#0645ad] hover:underline font-medium"
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
              </div>
            </article>

            {/* Sidebar - Analysis */}
            <aside className="lg:w-80 w-full">
              <div className="bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm lg:sticky lg:top-4 mb-8 lg:mb-0">
                <div className="bg-[#eaecf0] px-4 py-3 border-b border-[#a2a9b1]">
                  <h3 className="text-base font-bold text-[#202122]">
                    Truth Analysis
                  </h3>
                </div>
                <div className="p-4">
                  {insights ? (
                    <div className="space-y-6 text-sm">
                      {insights.biases_removed && insights.biases_removed.length > 0 && (
                        <div className="border-l-4 border-[#d33] pl-3">
                          <h4 className="font-semibold mb-2 text-[#202122]">Biases Removed:</h4>
                          <ul className="space-y-2 text-[#54595d]">
                            {insights.biases_removed.map((bias: string, i: number) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-[#d33] mt-1">•</span>
                                <span>{bias}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {insights.context_added && insights.context_added.length > 0 && (
                        <div className="border-l-4 border-[#0645ad] pl-3">
                          <h4 className="font-semibold mb-2 text-[#202122]">Context Added:</h4>
                          <ul className="space-y-2 text-[#54595d]">
                            {insights.context_added.map((context: string, i: number) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-[#0645ad] mt-1">•</span>
                                <span>{context}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {insights.corrections && insights.corrections.length > 0 && (
                        <div className="border-l-4 border-[#fc3] pl-3">
                          <h4 className="font-semibold mb-2 text-[#202122]">Corrections Made:</h4>
                          <ul className="space-y-2 text-[#54595d]">
                            {insights.corrections.map((correction: string, i: number) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-[#fc3] mt-1">•</span>
                                <span>{correction}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {insights.narratives_challenged && insights.narratives_challenged.length > 0 && (
                        <div className="border-l-4 border-[#f60] pl-3">
                          <h4 className="font-semibold mb-2 text-[#202122]">Narratives Challenged:</h4>
                          <ul className="space-y-2 text-[#54595d]">
                            {insights.narratives_challenged.map((narrative: string, i: number) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-[#f60] mt-1">•</span>
                                <span>{narrative}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic text-sm">
                      Analyzing content...
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!showResults && !error && (
        <div className="mx-auto max-w-4xl px-4 py-24">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#f8f9fa] border-2 border-[#a2a9b1]">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#54595d]">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#202122] mb-2">
                Search for Truth
              </h2>
              <p className="text-[#54595d] text-base max-w-md mx-auto">
                Enter any Wikipedia article URL to see it rewritten with bias removed 
                and context added for a more balanced perspective.
              </p>
            </div>
            <div className="text-sm text-[#54595d] bg-[#f8f9fa] border border-[#a2a9b1] rounded p-4 max-w-xl mx-auto">
              <p className="font-semibold mb-1">Example:</p>
              <code className="text-[#0645ad]">https://en.wikipedia.org/wiki/Elon_Musk</code>
            </div>
          </div>
        </div>
      )}

          {/* Back to Top Button */}
          {showBackToTop && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-8 right-8 bg-[#f8f9fa] border-2 border-[#a2a9b1] rounded-full p-3 shadow-lg hover:bg-white transition-all"
              aria-label="Back to top"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
