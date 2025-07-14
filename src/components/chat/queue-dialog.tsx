import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListMusic } from "lucide-react";
import { Song } from "../../lib/types";

interface QueueDialogProps {
  queue: Song[];
  theme: any;
  mode: "light" | "dark";
}

export const QueueDialog: React.FC<QueueDialogProps> = ({
  queue,
  theme,
  mode,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <ListMusic />
        </Button>
      </DialogTrigger>
      <DialogContent
        style={{
          background: theme.header.background[mode],
          color: theme.header.statusValue[mode],
          border: `1px solid ${theme.header.border[mode]}`,
        }}
      >
        <DialogHeader>
          <DialogTitle>Song Queue</DialogTitle>
        </DialogHeader>
        <div>
          {queue.length > 0 ? (
            <ul>
              {queue.map((song, index) => (
                <li key={index} className="border-b p-2">
                  {song.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>The queue is empty.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
