import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

const KEY = 'grokipedia-theme';

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    const initial = stored ? stored === 'dark' : document.documentElement.classList.contains('dark');
    setDark(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem(KEY, next ? 'dark' : 'light');
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={toggle} aria-label="Toggle dark mode" className="h-8 w-8 p-0 hover:bg-white">
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </Button>
  );
}


