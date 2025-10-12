import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BookmarkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (tags: string) => void;
}

export default function BookmarkDialog({
    open,
    onOpenChange,
    onSave,
}: BookmarkDialogProps) {
    const [tags, setTags] = useState("");

    const handleSave = () => {
        onSave(tags);
        setTags(""); // Reset input after saving
    };

    const handleCancel = () => {
        setTags(""); // Reset input on cancel
        onOpenChange(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Bookmark</DialogTitle>
                    <DialogDescription>
                        Add tags to help you organize your bookmarks.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        id="tags"
                        placeholder="e.g., science, history, favorites"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
