import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Index = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState("");
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState("");

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
        toast.success("Article loaded from cache!");
        return;
      }

      // Handle streaming response (SSE)
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
              setIsLoading(false);
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
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="text-center">
            <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground mb-1">
              GROKIPEDIA
            </h1>
            <p className="text-sm text-muted-foreground">
              The Truth-Seeking Encyclopedia
            </p>
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
                {rewrittenContent ? (
                  <div className="wikipedia-article">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {rewrittenContent}
                    </ReactMarkdown>
                    
                    {/* Wikipedia-style footer note */}
                    <div className="mt-8 pt-6 border-t border-[#a2a9b1]">
                      <div className="text-sm text-[#54595d] bg-[#f8f9fa] rounded p-4">
                        <p className="font-semibold mb-2">📚 About Sources</p>
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
                  <div className="text-muted-foreground italic">
                    Processing article...
                  </div>
                )}
              </div>
            </article>

            {/* Sidebar - Analysis */}
            <aside className="lg:w-80">
              <div className="bg-[#f8f9fa] border border-[#a2a9b1] p-4 sticky top-4">
                <h3 className="text-sm font-bold mb-3 pb-2 border-b border-[#a2a9b1]">
                  Truth Analysis
                </h3>
                {insights ? (
                  <div className="space-y-4 text-sm">
                    {insights.biases_removed && insights.biases_removed.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Biases Removed:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {insights.biases_removed.map((bias: string, i: number) => (
                            <li key={i}>{bias}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insights.context_added && insights.context_added.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Context Added:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {insights.context_added.map((context: string, i: number) => (
                            <li key={i}>{context}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insights.corrections && insights.corrections.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Corrections Made:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {insights.corrections.map((correction: string, i: number) => (
                            <li key={i}>{correction}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insights.sources_questioned && insights.sources_questioned.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Sources Questioned:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {insights.sources_questioned.map((source: string, i: number) => (
                            <li key={i}>{source}</li>
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
            </aside>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!showResults && !error && (
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-muted-foreground text-lg">
            Enter a Wikipedia URL above to get started
          </p>
        </div>
      )}
    </div>
  );
};

export default Index;
