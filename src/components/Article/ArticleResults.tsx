import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Columns } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReadingProgress from "@/components/Article/ReadingProgress";
import TableOfContents from "@/components/Article/TableOfContents";
import TTSControls from "@/components/Article/TTSControls";
import FontSizeControls from "@/components/Article/FontSizeControls";
import ThemeToggle from "@/components/Theme/ThemeToggle";
import BookmarkButton from "@/components/Actions/BookmarkButton";
import ShareButton from "@/components/Actions/ShareButton";
import InsightsPanel from "@/components/Insights/InsightsPanel";
import ArticleLeftSidebar from "@/components/Article/ArticleLeftSidebar";
import ArticleInfobox from "@/components/Article/ArticleInfobox";
import { InsightType } from "@/components/Insights/InsightsFilter";

interface ArticleResultsProps {
  url: string;
  rewrittenContent: string;
  insights: any;
  filters: InsightType[];
  onFiltersChange: (filters: InsightType[]) => void;
  onOpenDialog: (type: string) => void;
  onExportPDF: () => void;
  isExporting: boolean;
  showCompare: boolean;
  onShowCompareChange: (show: boolean) => void;
  isLoading: boolean;
  articleRef: React.RefObject<HTMLDivElement>;
}

const ArticleResults = memo(
  ({
    url,
    rewrittenContent,
    insights,
    filters,
    onFiltersChange,
    onOpenDialog,
    onExportPDF,
    isExporting,
    showCompare,
    onShowCompareChange,
    isLoading,
    articleRef,
  }: ArticleResultsProps) => {
    const handleCompareToggle = useCallback(() => {
      onShowCompareChange(!showCompare);
    }, [showCompare, onShowCompareChange]);

    // Extract article title from URL
    const articleTitle = url.split('/wiki/')[1]?.replace(/_/g, ' ') || 'Article';

    return (
      <div className="bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-6">
          <div className="flex gap-6">
            {/* Left Sidebar - TOC and Tools */}
            <ArticleLeftSidebar
              targetRef={articleRef as unknown as React.RefObject<HTMLElement>}
              onExportPDF={onExportPDF}
              isExporting={isExporting}
            />

            {/* Main Article Area */}
            <article className="flex-1 min-w-0 max-w-[860px]">
              {/* Reading progress */}
              <ReadingProgress
                targetRef={articleRef as unknown as React.RefObject<HTMLElement>}
              />

              {/* Breadcrumb Navigation */}
              {rewrittenContent && (
                <nav className="mb-3 text-xs text-[#54595d]" aria-label="Breadcrumb">
                  <ol className="flex items-center gap-2">
                    <li>
                      <a href="/" className="text-[#0645ad] hover:underline">
                        Home
                      </a>
                    </li>
                    <li className="text-[#a2a9b1]">›</li>
                    <li>
                      <span className="text-[#0645ad] hover:underline cursor-pointer">
                        Articles
                      </span>
                    </li>
                    <li className="text-[#a2a9b1]">›</li>
                    <li className="text-[#202122] font-medium">
                      {articleTitle}
                    </li>
                  </ol>
                </nav>
              )}

              {/* Article Title and Metadata */}
              {rewrittenContent && (
                <div className="mb-6">
                  <h1 className="font-serif text-4xl font-normal text-[#202122] border-b border-[#a2a9b1] pb-2 mb-2">
                    {articleTitle}
                  </h1>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <p className="text-sm text-[#54595d] italic">
                      From Grokipedia, the truth-seeking encyclopedia
                    </p>
                    <p className="text-xs text-[#72777d] flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      Last analyzed: {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Article Header Metadata */}
              {rewrittenContent && (
                <div className="mb-6 pb-3 border-b border-[#e8e9ea] bg-[#f8f9fa]/30 rounded px-3 py-2 -mx-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-[#72777d]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-60"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>Rewritten for clarity and neutrality</span>
                      <span className="mx-2 hidden sm:inline opacity-50">•</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0645ad] hover:underline hidden sm:inline opacity-80 hover:opacity-100"
                      >
                        View original article
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex items-center gap-0.5 border border-[#c8ccd1] bg-white/80 rounded opacity-90 hover:opacity-100 transition-opacity">
                        <TTSControls
                          targetRef={
                            articleRef as unknown as React.RefObject<HTMLElement>
                          }
                          className="hidden lg:flex"
                        />
                      </div>
                      <div className="flex items-center gap-0.5 border border-[#c8ccd1] bg-white/80 rounded opacity-90 hover:opacity-100 transition-opacity">
                        <FontSizeControls />
                      </div>
                      <div className="border border-[#c8ccd1] bg-white/80 rounded opacity-90 hover:opacity-100 transition-opacity">
                        <ThemeToggle />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-xs border border-[#a2a9b1] bg-[#f8f9fa] hover:bg-white"
                        onClick={handleCompareToggle}
                        aria-label="Toggle comparison"
                      >
                        <Columns className="h-3.5 w-3.5 mr-1.5" />
                        <span className="hidden sm:inline">Compare</span>
                      </Button>
                      <BookmarkButton url={url} />
                      <ShareButton
                        url={url}
                        view={showCompare ? "compare" : undefined}
                      />
                      <Button
                        onClick={onExportPDF}
                        disabled={isExporting}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs border border-[#a2a9b1] bg-[#f8f9fa] hover:bg-white disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        <span className="hidden sm:inline">
                          {isExporting ? "Exporting..." : "PDF"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Article Content */}
              {rewrittenContent ? (
                <div className="wikipedia-article" ref={articleRef}>
                  {/* Infobox */}
                  <ArticleInfobox title={articleTitle} url={url} />

                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 {...props} className="group">
                          {props.children}
                          <span className="ml-3 text-xs text-[#0645ad] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:underline font-normal">
                            [edit]
                          </span>
                        </h1>
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 {...props} className="group">
                          {props.children}
                          <span className="ml-3 text-xs text-[#0645ad] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:underline font-normal">
                            [edit]
                          </span>
                        </h2>
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 {...props} className="group">
                          {props.children}
                          <span className="ml-2 text-xs text-[#0645ad] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:underline font-normal">
                            [edit]
                          </span>
                        </h3>
                      ),
                      h4: ({ node, ...props }) => (
                        <h4 {...props} className="group">
                          {props.children}
                          <span className="ml-2 text-xs text-[#0645ad] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:underline font-normal">
                            [edit]
                          </span>
                        </h4>
                      ),
                    }}
                  >
                    {rewrittenContent}
                  </ReactMarkdown>

                  {/* References Section */}
                  <div className="mt-12">
                    <h2 className="text-2xl font-serif border-b border-[#a2a9b1] pb-2 mb-4 text-[#202122]">
                      References
                    </h2>
                    <div className="text-sm text-[#54595d] bg-[#f8f9fa] border border-[#a2a9b1] rounded p-4 mb-6">
                      <p className="leading-relaxed">
                        This article has been rewritten for clarity and neutrality based on the original Wikipedia article.
                        All facts and information are sourced from:{" "}
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0645ad] hover:underline font-medium break-all"
                        >
                          {url}
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* External Links Section */}
                  <div className="mt-8">
                    <h2 className="text-2xl font-serif border-b border-[#a2a9b1] pb-2 mb-4 text-[#202122]">
                      External links
                    </h2>
                    <ul className="list-none space-y-2 text-sm">
                      <li>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0645ad] hover:underline"
                        >
                          Original Wikipedia article
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Categories Section */}
                  <div className="mt-8 pt-4 border-t border-[#a2a9b1]">
                    <div className="bg-[#f8f9fa] border border-[#a2a9b1] rounded p-3">
                      <p className="text-xs text-[#54595d]">
                        <span className="font-semibold text-[#202122]">Categories:</span>{" "}
                        <span className="text-[#0645ad]">Grokipedia articles</span>
                        {" • "}
                        <span className="text-[#0645ad]">Truth-analyzed content</span>
                        {" • "}
                        <span className="text-[#0645ad]">Rewritten for neutrality</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-[#54595d]">
                  Loading article...
                </div>
              )}
            </article>

            {/* Right Sidebar - Insights Panel */}
            <aside className="w-full lg:w-80 lg:sticky lg:top-20 lg:h-fit flex-shrink-0">
              <InsightsPanel
                insights={insights}
                filters={filters}
                onFiltersChange={onFiltersChange}
                onOpenDialog={onOpenDialog}
                isLoading={isLoading}
              />
            </aside>
          </div>
        </div>
      </div>
    );
  }
);

ArticleResults.displayName = "ArticleResults";

export default ArticleResults;

