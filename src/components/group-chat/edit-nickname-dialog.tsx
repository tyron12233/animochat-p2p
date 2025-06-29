// Create a new component for the edit nickname dialog
// EditNicknameDialog.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface EditNicknameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newNickname: string) => void;
  currentNickname: string;
}

export default function EditNicknameDialog({
  isOpen,
  onClose,
  onSave,
  currentNickname,
}: EditNicknameDialogProps) {
  const [nickname, setNickname] = useState(currentNickname);

  const handleSave = () => {
    onSave(nickname);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Nickname</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter your new nickname"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}