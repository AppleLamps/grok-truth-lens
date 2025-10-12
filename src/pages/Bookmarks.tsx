import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, Trash2, ExternalLink, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  tags: string[];
  t: number;
}

const KEY = 'grokipedia-bookmarks';

function loadBookmarks(): BookmarkItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as BookmarkItem[];
  } catch {
    return [];
  }
}

function saveBookmarks(items: BookmarkItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  const deleteBookmark = (id: string) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    saveBookmarks(updated);
    toast.success("Bookmark removed");
  };

  const clearAllBookmarks = () => {
    if (window.confirm('Are you sure you want to clear all bookmarks?')) {
      setBookmarks([]);
      localStorage.removeItem(KEY);
      toast.success("All bookmarks cleared");
    }
  };

  const loadArticle = (url: string) => {
    navigate(`/?url=${encodeURIComponent(url)}`);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Group bookmarks by time periods
  const groupedBookmarks = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    const groups = {
      recent: [] as BookmarkItem[],
      thisWeek: [] as BookmarkItem[],
      thisMonth: [] as BookmarkItem[],
      older: [] as BookmarkItem[],
    };

    bookmarks.forEach((item) => {
      const diff = now - item.t;
      if (diff < oneWeek) {
        groups.recent.push(item);
      } else if (diff < oneMonth) {
        groups.thisWeek.push(item);
      } else if (diff < 3 * oneMonth) {
        groups.thisMonth.push(item);
      } else {
        groups.older.push(item);
      }
    });

    return groups;
  }, [bookmarks]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-center">
              <h1
                onClick={() => navigate('/')}
                className="font-serif text-5xl font-bold tracking-tight text-foreground mb-1 cursor-pointer hover:opacity-80 transition-opacity inline-block"
                role="button"
                tabIndex={0}
              >
                GROKIPEDIA
              </h1>
              <p className="text-sm text-muted-foreground">
                Your Bookmarked Articles
              </p>
            </div>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#f8f9fa] to-[#eaecf0] rounded-lg border border-[#a2a9b1] shadow-sm">
              <Bookmark className="h-6 w-6 text-[#0645ad]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#202122]">My Bookmarks</h2>
              <p className="text-sm text-[#54595d]">{bookmarks.length} saved articles</p>
            </div>
          </div>
          {bookmarks.length > 0 && (
            <Button
              onClick={clearAllBookmarks}
              variant="ghost"
              size="sm"
              className="text-[#d33] hover:text-[#d33] hover:bg-red-50"
            >
              Clear All
            </Button>
          )}
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#f8f9fa] to-[#eaecf0] border-2 border-[#a2a9b1] shadow-sm mb-6">
              <Bookmark className="h-12 w-12 text-[#54595d]" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#202122] mb-3">
              No Bookmarks Yet
            </h3>
            <p className="text-[#54595d] text-lg max-w-md mx-auto leading-relaxed mb-6">
              Start bookmarking articles to build your personal collection of truth-seeking content.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-[#0645ad] hover:bg-[#0b5cb5] text-white"
            >
              Browse Articles
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Recent */}
            {groupedBookmarks.recent.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#54595d] uppercase tracking-wider mb-3 px-2">
                  Recent
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedBookmarks.recent.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="group relative bg-white border border-[#c8ccd1] rounded-lg hover:border-[#0645ad] hover:shadow-lg transition-all duration-200 p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0645ad]">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base text-[#202122] mb-1 line-clamp-2">
                            {bookmark.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-[#54595d] mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {formatTime(bookmark.t)}
                          </div>
                          {bookmark.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {bookmark.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-0.5 bg-[#f8f9fa] border border-[#a2a9b1] rounded text-xs text-[#54595d]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => loadArticle(bookmark.url)}
                          size="sm"
                          className="flex-1 h-8 bg-[#0645ad] hover:bg-[#0b5cb5] text-white text-xs"
                        >
                          Load Article
                        </Button>
                        <Button
                          onClick={() => window.open(bookmark.url, '_blank')}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 border border-[#a2a9b1]"
                          title="View on Wikipedia"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => deleteBookmark(bookmark.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-[#54595d] hover:text-[#d33] hover:bg-red-50 border border-[#a2a9b1]"
                          title="Remove bookmark"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* This Week */}
            {groupedBookmarks.thisWeek.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#54595d] uppercase tracking-wider mb-3 px-2">
                  This Month
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedBookmarks.thisWeek.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="group relative bg-white border border-[#c8ccd1] rounded-lg hover:border-[#0645ad] hover:shadow-lg transition-all duration-200 p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0645ad]">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base text-[#202122] mb-1 line-clamp-2">
                            {bookmark.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-[#54595d] mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {formatTime(bookmark.t)}
                          </div>
                          {bookmark.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {bookmark.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-0.5 bg-[#f8f9fa] border border-[#a2a9b1] rounded text-xs text-[#54595d]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => loadArticle(bookmark.url)}
                          size="sm"
                          className="flex-1 h-8 bg-[#0645ad] hover:bg-[#0b5cb5] text-white text-xs"
                        >
                          Load Article
                        </Button>
                        <Button
                          onClick={() => window.open(bookmark.url, '_blank')}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 border border-[#a2a9b1]"
                          title="View on Wikipedia"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => deleteBookmark(bookmark.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-[#54595d] hover:text-[#d33] hover:bg-red-50 border border-[#a2a9b1]"
                          title="Remove bookmark"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* This Month */}
            {groupedBookmarks.thisMonth.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#54595d] uppercase tracking-wider mb-3 px-2">
                  Earlier
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedBookmarks.thisMonth.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="group relative bg-white border border-[#c8ccd1] rounded-lg hover:border-[#0645ad] hover:shadow-lg transition-all duration-200 p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0645ad]">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base text-[#202122] mb-1 line-clamp-2">
                            {bookmark.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-[#54595d] mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {formatTime(bookmark.t)}
                          </div>
                          {bookmark.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {bookmark.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-0.5 bg-[#f8f9fa] border border-[#a2a9b1] rounded text-xs text-[#54595d]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => loadArticle(bookmark.url)}
                          size="sm"
                          className="flex-1 h-8 bg-[#0645ad] hover:bg-[#0b5cb5] text-white text-xs"
                        >
                          Load Article
                        </Button>
                        <Button
                          onClick={() => window.open(bookmark.url, '_blank')}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 border border-[#a2a9b1]"
                          title="View on Wikipedia"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => deleteBookmark(bookmark.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-[#54595d] hover:text-[#d33] hover:bg-red-50 border border-[#a2a9b1]"
                          title="Remove bookmark"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Older */}
            {groupedBookmarks.older.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-[#54595d] uppercase tracking-wider mb-3 px-2">
                  Older
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedBookmarks.older.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="group relative bg-white border border-[#c8ccd1] rounded-lg hover:border-[#0645ad] hover:shadow-lg transition-all duration-200 p-4"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0645ad]">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base text-[#202122] mb-1 line-clamp-2">
                            {bookmark.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-[#54595d] mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {formatTime(bookmark.t)}
                          </div>
                          {bookmark.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {bookmark.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-0.5 bg-[#f8f9fa] border border-[#a2a9b1] rounded text-xs text-[#54595d]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => loadArticle(bookmark.url)}
                          size="sm"
                          className="flex-1 h-8 bg-[#0645ad] hover:bg-[#0b5cb5] text-white text-xs"
                        >
                          Load Article
                        </Button>
                        <Button
                          onClick={() => window.open(bookmark.url, '_blank')}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 border border-[#a2a9b1]"
                          title="View on Wikipedia"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => deleteBookmark(bookmark.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-[#54595d] hover:text-[#d33] hover:bg-red-50 border border-[#a2a9b1]"
                          title="Remove bookmark"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
