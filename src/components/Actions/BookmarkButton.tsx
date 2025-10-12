import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import BookmarkDialog from "./BookmarkDialog";

const KEY = 'grokipedia-bookmarks';

interface BookmarkItem { id: string; url: string; title: string; tags: string[]; t: number; }

function load(): BookmarkItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as BookmarkItem[]; } catch { return []; }
}
function save(items: BookmarkItem[]) { localStorage.setItem(KEY, JSON.stringify(items)); }

export default function BookmarkButton({ url }: { url: string }) {
  const title = decodeURIComponent(url.split('/wiki/')[1]?.replace(/_/g, ' ') || 'Wikipedia Article');
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  useEffect(() => { setItems(load()); }, []);
  const existing = useMemo(() => items.find(i => i.url === url), [items, url]);

  const toggle = () => {
    const current = load();
    if (existing) {
      const next = current.filter(i => i.url !== url);
      save(next); setItems(next); return;
    }
    setDialogOpen(true);
  };

  const handleSave = (tagText: string) => {
    const current = load();
    const tags = tagText.split(',').map(s => s.trim()).filter(Boolean);
    const item: BookmarkItem = { id: `${Date.now()}`, url, title, tags, t: Date.now() };
    const next = [item, ...current].slice(0, 200);
    save(next); setItems(next);
    setDialogOpen(false);
  };

  const Icon = existing ? BookmarkCheck : Bookmark;
  const label = existing ? 'Remove bookmark' : 'Add bookmark';

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={toggle} aria-label={label} title={label} className="h-8 w-8 p-0 border border-[#a2a9b1] bg-[#f8f9fa] hover:bg-white">
        <Icon className="h-3.5 w-3.5" />
        <span className="sr-only">{label}</span>
      </Button>
      <BookmarkDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSave} />
    </>
  );
}


