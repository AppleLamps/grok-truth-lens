import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export default function ShareButton({ url, view }: { url: string; view?: string }) {
  const onShare = async () => {
    const origin = window.location.origin;
    const params = new URLSearchParams();
    if (url) params.set('url', url);
    if (view) params.set('view', view);
    const shareUrl = `${origin}/?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {}
  };
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onShare} aria-label="Copy share link" className="h-8 w-8 p-0 border border-[#a2a9b1] bg-[#f8f9fa] hover:bg-white">
      <Share2 className="h-3.5 w-3.5" />
      <span className="sr-only">Copy share link</span>
    </Button>
  );
}


