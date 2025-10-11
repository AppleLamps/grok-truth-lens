import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from "lucide-react";

const Index = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState("");
  const [insights, setInsights] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.includes("wikipedia.org")) {
      toast.error("Please enter a valid Wikipedia URL");
      return;
    }

    setIsLoading(true);
    setShowResults(true);
    setRewrittenContent("");
    setInsights("");

    // TODO: Implement API call to edge function
    toast.info("Processing Wikipedia article...");
    
    // Placeholder - will be replaced with real API call
    setTimeout(() => {
      setRewrittenContent("This is where the rewritten article will appear...");
      setInsights("Analysis and corrections will appear here...");
      setIsLoading(false);
    }, 2000);
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

      {/* Content Section */}
      {showResults && (
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Article Area */}
            <article className="flex-1 lg:max-w-3xl">
              <div className="bg-background rounded border border-border p-8">
                <h2 className="font-serif text-3xl font-bold mb-6 text-foreground border-b border-border pb-3">
                  Rewritten Article
                </h2>
                <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                  {rewrittenContent || (
                    <div className="text-muted-foreground italic">
                      Processing article...
                    </div>
                  )}
                </div>
              </div>
            </article>

            {/* Sidebar - Analysis */}
            <aside className="lg:w-80">
              <div className="bg-card rounded border border-border p-6 sticky top-4">
                <h3 className="font-semibold text-base mb-4 text-foreground border-b border-border pb-2">
                  Analysis & Corrections
                </h3>
                <div className="text-sm text-card-foreground space-y-3">
                  {insights || (
                    <div className="text-muted-foreground italic">
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
      {!showResults && (
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
