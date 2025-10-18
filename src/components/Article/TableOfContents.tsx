import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number; // 1..6
}

interface TableOfContentsProps {
  targetRef: React.RefObject<HTMLElement>;
  className?: string;
}

export default function TableOfContents({ targetRef, className }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const headings = Array.from(el.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];
    const mapped: TocItem[] = headings.map((h, idx) => {
      if (!h.id) {
        h.id = `h-${idx}-${(h.textContent || '').trim().toLowerCase().replace(/\s+/g, '-')}`;
      }
      const level = Number(h.tagName.replace('H', '')) || 2;
      return { id: h.id, text: h.textContent || '', level };
    });
    setItems(mapped);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top));
        if (visible[0]) setActiveId((visible[0].target as HTMLElement).id);
      },
      { rootMargin: '0px 0px -70% 0px', threshold: [0, 1] }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [targetRef]);

  const handleClick = (id: string) => {
    const node = document.getElementById(id);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    }
  };

  if (items.length === 0) return null;

  return (
    <nav className={cn("text-sm", className)} aria-label="Table of contents">
      <div className="font-bold mb-3 text-[#202122] text-base border-b border-[#a2a9b1] pb-2">
        Contents
      </div>
      <ul className="space-y-2">
        {items.map((it, idx) => (
          <li key={it.id} className={cn("leading-relaxed")}>
            <button
              type="button"
              className={cn(
                "text-left hover:underline w-full text-[#0645ad] hover:text-[#0b5cb5] transition-colors",
                it.level === 1 && "pl-0 font-semibold",
                it.level === 2 && "pl-0 font-medium",
                it.level === 3 && "pl-4 text-xs",
                it.level === 4 && "pl-6 text-xs",
                it.level >= 5 && "pl-8 text-xs",
                activeId === it.id && "font-bold text-[#202122]"
              )}
              onClick={() => handleClick(it.id)}
              aria-current={activeId === it.id ? 'location' : undefined}
            >
              <span className="mr-2 text-[#54595d] font-normal">
                {it.level <= 2 ? `${idx + 1}` : ''}
              </span>
              {it.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}


