import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, Bookmark, BarChart3, Moon, Sun, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavBarProps {
  onMenuClick?: () => void;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

const TopNavBar = ({
  onMenuClick,
  showSearch = true,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  isLoading = false,
}: TopNavBarProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleLogoClick = () => {
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#a2a9b1] bg-white shadow-sm">
      <div className="mx-auto flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Left Section - Logo */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden h-9 w-9 text-[#54595d] hover:bg-[#f8f9fa]"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 group"
          >
            <div className="flex items-center">
              <span className="font-serif text-xl font-bold text-[#202122] tracking-tight group-hover:text-[#0645ad] transition-colors">
                GROKIPEDIA
              </span>
            </div>
          </button>
        </div>

        {/* Center Section - Search */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <form onSubmit={onSearchSubmit} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#72777d]" />
                <Input
                  type="url"
                  placeholder="Enter Wikipedia URL..."
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="h-9 pl-9 pr-4 border-[#a2a9b1] bg-white text-sm text-[#202122] placeholder:text-[#72777d] focus:border-[#0645ad] focus:ring-1 focus:ring-[#0645ad]/20"
                  disabled={isLoading}
                />
              </div>
            </form>
          </div>
        )}

        {/* Right Section - User Tools */}
        <div className="flex items-center gap-1">
          {/* Mobile Search Toggle */}
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 text-[#54595d] hover:bg-[#f8f9fa]"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Bookmarks */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/bookmarks')}
            className="h-9 w-9 text-[#54595d] hover:bg-[#f8f9fa] hover:text-[#0645ad]"
            title="Bookmarks"
          >
            <Bookmark className="h-4 w-4" />
          </Button>

          {/* Analytics */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/analytics')}
            className="h-9 w-9 text-[#54595d] hover:bg-[#f8f9fa] hover:text-[#0645ad]"
            title="Analytics"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[#54595d] hover:bg-[#f8f9fa]"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Expanded */}
      {showSearch && isSearchExpanded && (
        <div className="md:hidden border-t border-[#a2a9b1] bg-[#f8f9fa] px-4 py-3">
          <form onSubmit={onSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#72777d]" />
              <Input
                type="url"
                placeholder="Enter Wikipedia URL..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-10 pl-9 pr-4 border-[#a2a9b1] bg-white text-[#202122] placeholder:text-[#72777d]"
                disabled={isLoading}
              />
            </div>
          </form>
        </div>
      )}
    </nav>
  );
};

export default TopNavBar;

