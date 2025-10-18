import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ArticleSearchFormProps {
  url: string;
  isLoading: boolean;
  onUrlChange: (url: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  formRef: React.RefObject<HTMLFormElement>;
}

const ArticleSearchForm = ({
  url,
  isLoading,
  onUrlChange,
  onSubmit,
  formRef,
}: ArticleSearchFormProps) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUrlChange(e.target.value);
    },
    [onUrlChange]
  );

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <form ref={formRef} onSubmit={onSubmit}>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#72777d]" />
              <Input
                type="url"
                placeholder="Enter Wikipedia URL (e.g., https://en.wikipedia.org/wiki/...)"
                value={url}
                onChange={handleChange}
                className="h-12 pl-10 pr-4 border-[#a2a9b1] bg-white text-[#202122] placeholder:text-[#72777d] focus:border-[#0645ad] focus:ring-2 focus:ring-[#0645ad]/20 transition-all shadow-sm"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 px-8 bg-[#0645ad] hover:bg-[#0b5cb5] text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Search"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleSearchForm;

