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
    <Button type="button" variant="outline" size="sm" onClick={onShare} aria-label="Copy share link">
      <Share2 className="h-3 w-3" />
      <span className="sr-only">Copy share link</span>
    </Button>
  );
}


