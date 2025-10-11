import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-foreground">Grokipedia</h1>
          <p className="text-xl text-muted-foreground">
            Enter a Wikipedia URL to get a maximally truthful, bias-aware version
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mx-auto max-w-3xl space-y-4">
            <Input
              type="url"
              placeholder="https://en.wikipedia.org/wiki/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-14 text-lg"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full text-lg"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Grok It"}
            </Button>
          </div>
        </form>

        {showResults && (
          <div className="grid gap-6 lg:grid-cols-4">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Rewritten Article</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-foreground">
                  {rewrittenContent || "Loading..."}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analysis & Corrections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {insights || "Analyzing..."}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
