import { FileText, Lightbulb, Columns, History } from "lucide-react";

interface ArticleTabsProps {
  activeTab: "article" | "analysis" | "compare" | "history";
  onTabChange: (tab: "article" | "analysis" | "compare" | "history") => void;
  showCompare?: boolean;
}

const ArticleTabs = ({ activeTab, onTabChange, showCompare = true }: ArticleTabsProps) => {
  const tabs = [
    { id: "article" as const, label: "Article", icon: FileText },
    { id: "analysis" as const, label: "Truth Analysis", icon: Lightbulb },
    ...(showCompare ? [{ id: "compare" as const, label: "Compare", icon: Columns }] : []),
    { id: "history" as const, label: "History", icon: History },
  ];

  return (
    <div className="border-b border-[#a2a9b1] bg-white">
      <div className="flex gap-1 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all
                border-b-2 -mb-px
                ${
                  isActive
                    ? "border-[#0645ad] text-[#0645ad] bg-[#f8f9fa]"
                    : "border-transparent text-[#54595d] hover:text-[#202122] hover:bg-[#f8f9fa]/50"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ArticleTabs;

