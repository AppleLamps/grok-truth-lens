import { useMemo, useCallback } from "react";
import { Trash2, History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

interface SearchHistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
}

interface ArticleSidebarProps {
  searchHistory: SearchHistoryItem[];
  onLoadFromHistory: (url: string) => void;
  onDeleteFromHistory: (id: string) => void;
}

const formatTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
};

const ArticleSidebar = ({
  searchHistory,
  onLoadFromHistory,
  onDeleteFromHistory,
}: ArticleSidebarProps) => {
  // Group history by time periods
  const groupedHistory = useMemo(() => {
    const now = Date.now();
    const today = new Date(now).setHours(0, 0, 0, 0);
    const yesterday = today - 86400000;
    const weekAgo = today - 604800000;

    return {
      today: searchHistory.filter((item) => item.timestamp >= today),
      yesterday: searchHistory.filter(
        (item) => item.timestamp >= yesterday && item.timestamp < today
      ),
      thisWeek: searchHistory.filter(
        (item) => item.timestamp >= weekAgo && item.timestamp < yesterday
      ),
      older: searchHistory.filter((item) => item.timestamp < weekAgo),
    };
  }, [searchHistory]);

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onDeleteFromHistory(id);
    },
    [onDeleteFromHistory]
  );

  const HistoryGroup = ({
    label,
    items,
  }: {
    label: string;
    items: SearchHistoryItem[];
  }) => {
    if (items.length === 0) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-bold text-[#54595d] uppercase tracking-wider mb-2 px-2">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="space-y-1.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white border border-[#c8ccd1] rounded-lg hover:border-[#0645ad] hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <button
                  onClick={() => onLoadFromHistory(item.url)}
                  className="w-full text-left p-3 pr-10"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <History className="h-3.5 w-3.5 text-[#0645ad]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#202122] group-hover:text-[#0645ad] transition-colors line-clamp-2 leading-snug mb-1">
                        {item.title}
                      </div>
                      <div className="text-xs text-[#54595d]">
                        {formatTime(item.timestamp)}
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => handleDelete(e, item.id)}
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
    );
  };

  if (searchHistory.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-[#54595d]">
        No search history yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <HistoryGroup label="Today" items={groupedHistory.today} />
        <HistoryGroup label="Yesterday" items={groupedHistory.yesterday} />
        <HistoryGroup label="This Week" items={groupedHistory.thisWeek} />
        <HistoryGroup label="Older" items={groupedHistory.older} />
      </div>
    </ScrollArea>
  );
};

export default ArticleSidebar;

