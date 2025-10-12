import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { diffWords } from "diff";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DiffViewProps {
  originalUrl: string;
  rewrittenMarkdown: string;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/[>*_#~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function DiffView({ originalUrl, rewrittenMarkdown }: DiffViewProps) {
  const [originalText, setOriginalText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOriginal = async () => {
      setIsLoading(true);
      try {
        // First, try to get from our cache (which has the scraped content)
        const { data: cached } = await supabase
          .from('article_cache')
          .select('original_content')
          .eq('wikipedia_url', originalUrl)
          .maybeSingle();

        if (cached?.original_content) {
          // Use the scraped markdown content
          setOriginalText(stripMarkdown(cached.original_content));
          setIsLoading(false);
          return;
        }

        // Fallback: fetch from Wikipedia API (summary only, as page/plain doesn't exist)
        const title = originalUrl.split('/wiki/')[1];
        if (!title) {
          setIsLoading(false);
          return;
        }

        const summaryResp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        if (summaryResp.ok) {
          const s = await summaryResp.json();
          setOriginalText(s.extract || "");
        }
      } catch (error) {
        console.error('Error fetching original content:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOriginal();
  }, [originalUrl]);

  const inlineDiff = useMemo(() => {
    const a = (originalText || "").trim();
    const b = stripMarkdown(rewrittenMarkdown || "");
    if (!a || !b) return null;
    return diffWords(a, b);
  }, [originalText, rewrittenMarkdown]);

  return (
    <div className="border border-[#a2a9b1] h-full">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={45} minSize={20}>
          <div className="h-full overflow-auto p-4 bg-white">
            <div className="text-xs font-semibold mb-2">Original</div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#54595d]">
                <div className="animate-spin h-4 w-4 border-2 border-[#0645ad] border-t-transparent rounded-full"></div>
                Loading original content...
              </div>
            ) : originalText ? (
              <div className="whitespace-pre-wrap break-words text-sm opacity-90">{originalText}</div>
            ) : (
              <div className="text-sm text-[#54595d] italic">Original content unavailable</div>
            )}
          </div>
        </Panel>
        <PanelResizeHandle className="w-1 bg-[#a2a9b1]" />
        <Panel minSize={20}>
          <div className="h-full overflow-auto p-4 bg-white">
            <div className="text-xs font-semibold mb-2">Rewritten (inline diff)</div>
            <div className="text-sm leading-6">
              {isLoading ? (
                <div className="flex items-center gap-2 text-[#54595d]">
                  <div className="animate-spin h-4 w-4 border-2 border-[#0645ad] border-t-transparent rounded-full"></div>
                  Preparing comparison...
                </div>
              ) : inlineDiff ? (
                inlineDiff.map((part, i) => {
                  if (part.added) return <mark key={i} className="bg-green-100 text-green-800">{part.value}</mark>;
                  if (part.removed) return <del key={i} className="bg-red-50 text-red-700">{part.value}</del>;
                  return <span key={i}>{part.value}</span>;
                })
              ) : (
                <pre className="whitespace-pre-wrap break-words">{stripMarkdown(rewrittenMarkdown || "")}</pre>
              )}
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}


