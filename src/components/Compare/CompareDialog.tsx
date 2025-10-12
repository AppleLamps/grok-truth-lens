import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import DiffView from "./DiffView";

interface CompareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    originalUrl: string;
    rewrittenMarkdown: string;
}

export default function CompareDialog({
    open,
    onOpenChange,
    originalUrl,
    rewrittenMarkdown,
}: CompareDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-full h-full max-h-full flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b border-[#a2a9b1] bg-gradient-to-r from-[#f8f9fa] to-transparent">
                    <DialogTitle className="text-xl font-bold text-[#202122]">
                        Article Comparison
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    <DiffView originalUrl={originalUrl} rewrittenMarkdown={rewrittenMarkdown} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
