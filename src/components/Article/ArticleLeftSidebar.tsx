import { Download, Share2, Bookmark, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TableOfContents from "./TableOfContents";

interface ArticleLeftSidebarProps {
  targetRef: React.RefObject<HTMLElement>;
  onExportPDF?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onAnalytics?: () => void;
  isExporting?: boolean;
}

const ArticleLeftSidebar = ({
  targetRef,
  onExportPDF,
  onShare,
  onBookmark,
  onAnalytics,
  isExporting = false,
}: ArticleLeftSidebarProps) => {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-20 space-y-4">
        {/* Table of Contents */}
        <div className="bg-[#f8f9fa] border border-[#a2a9b1] rounded-lg p-4 shadow-sm">
          <TableOfContents targetRef={targetRef} />
        </div>

        {/* Tools Section */}
        <div className="bg-white border border-[#a2a9b1] rounded-lg overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-[#eaecf0] to-[#f6f6f6] px-4 py-2.5 border-b border-[#a2a9b1]">
            <h3 className="text-sm font-bold text-[#202122]">Tools</h3>
          </div>
          <div className="p-2">
            <div className="space-y-1">
              {onExportPDF && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExportPDF}
                  disabled={isExporting}
                  className="w-full justify-start text-[#0645ad] hover:bg-[#f8f9fa] hover:text-[#0b5cb5] h-8 px-3 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-2" />
                  {isExporting ? "Exporting..." : "Download PDF"}
                </Button>
              )}
              {onBookmark && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBookmark}
                  className="w-full justify-start text-[#0645ad] hover:bg-[#f8f9fa] hover:text-[#0b5cb5] h-8 px-3 text-xs"
                >
                  <Bookmark className="h-3.5 w-3.5 mr-2" />
                  Bookmark
                </Button>
              )}
              {onShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShare}
                  className="w-full justify-start text-[#0645ad] hover:bg-[#f8f9fa] hover:text-[#0b5cb5] h-8 px-3 text-xs"
                >
                  <Share2 className="h-3.5 w-3.5 mr-2" />
                  Share
                </Button>
              )}
              {onAnalytics && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAnalytics}
                  className="w-full justify-start text-[#0645ad] hover:bg-[#f8f9fa] hover:text-[#0b5cb5] h-8 px-3 text-xs"
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-2" />
                  Analytics
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ArticleLeftSidebar;

