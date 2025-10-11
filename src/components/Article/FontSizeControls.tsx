import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const KEY = 'grokipedia-font-size';

export default function FontSizeControls() {
  const [size, setSize] = useState<number>(14);

  useEffect(() => {
    const stored = Number(localStorage.getItem(KEY) || '14');
    if (stored && isFinite(stored)) {
      setSize(stored);
      document.documentElement.style.setProperty('--article-font-size', `${stored}px`);
    }
  }, []);

  const apply = (val: number) => {
    const clamped = Math.max(12, Math.min(20, Math.round(val)));
    setSize(clamped);
    document.documentElement.style.setProperty('--article-font-size', `${clamped}px`);
    localStorage.setItem(KEY, String(clamped));
  };

  return (
    <div className="flex items-center gap-1" aria-label="Font size">
      <Button type="button" size="sm" variant="outline" onClick={() => apply(size - 1)} aria-label="Decrease font size">A</Button>
      <Button type="button" size="sm" variant="outline" onClick={() => apply(14)} aria-label="Reset font size">A</Button>
      <Button type="button" size="sm" variant="outline" onClick={() => apply(size + 1)} aria-label="Increase font size" className="text-lg">A</Button>
    </div>
  );
}


