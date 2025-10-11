import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ReadingProgressProps {
  targetRef: React.RefObject<HTMLElement>;
  className?: string;
}

export default function ReadingProgress({ targetRef, className }: ReadingProgressProps) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = targetRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const total = el.offsetHeight - viewport;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const pct = Math.round((scrolled / Math.max(total, 1)) * 100);
      setPercent(isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetRef]);

  return (
    <div className={cn("sticky top-0 z-10", className)}>
      <Progress value={Math.max(0, Math.min(100, percent))} aria-label="Reading progress" className="h-1" />
    </div>
  );
}


