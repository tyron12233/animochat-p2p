import React, { useEffect, useState } from "react";
import { Music, Pause, Play, X } from "lucide-react";
import { ChatThemeV2 } from "../lib/chat-theme";
import SetSongDialog from "./set-song-dialog";

interface AdminControlsProps {
  onSetSong: (name: string, url: string) => void;
  theme: ChatThemeV2;
  mode: "light" | "dark";
  socket: WebSocket | null;
  isPlaying: boolean;
  progress: number;
  play: () => void;
  playbackBlocked: boolean;
  unblockPlayback: () => void;
}

/**
 * A component that provides admin controls, such as setting a song.
 * @param {AdminControlsProps} props The props for the component.
 * @returns {JSX.Element} The rendered admin controls.
 */
const AdminControls: React.FC<AdminControlsProps> = ({
  onSetSong,
  theme,
  mode,
  socket,
  isPlaying,
  progress,
  play,
  playbackBlocked,
  unblockPlayback,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePlay = () => {
    if (playbackBlocked) {
      unblockPlayback();
      return;
    }
    if (socket) {
      socket.send(
        JSON.stringify({
          type: "music_play",
          content: { currentTime: progress },
        })
      );
      play();
    }
  };

  const handlePause = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: "music_pause", content: {} }));
    }
  };

  const handleRemoveSong = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: "music_set", content: {} }));
    }
  };

  return (
    <div
      className="w-full flex justify-end items-center gap-2 p-2"
      style={{
        background: theme.header.background[mode],
      }}
    >
      {isPlaying ? (
        <button
          onClick={handlePause}
          style={{
            background: theme.buttons.secondary.background[mode],
            color: theme.buttons.secondary.text[mode],
            borderColor:
              theme.buttons.secondary.border?.[mode] || "transparent",
          }}
          className="p-2 rounded-full"
          title="Pause the song for everyone"
        >
          <Pause size={20} />
        </button>
      ) : (
        <button
          onClick={handlePlay}
          style={{
            background: theme.buttons.secondary.background[mode],
            color: theme.buttons.secondary.text[mode],
            borderColor:
              theme.buttons.secondary.border?.[mode] || "transparent",
          }}
          className="p-2 rounded-full"
          title="Play the song for everyone"
        >
          <Play size={20} />
        </button>
      )}
      <button
        onClick={() => setIsDialogOpen(true)}
        style={{
          background: theme.buttons.secondary.background[mode],
          color: theme.buttons.secondary.text[mode],
          borderColor: theme.buttons.secondary.border?.[mode] || "transparent",
        }}
        className="p-2 rounded-full"
        title="Set a song for the group"
      >
        <Music size={20} />
      </button>
      <button
        onClick={handleRemoveSong}
        style={{
          background: theme.buttons.secondary.background[mode],
          color: theme.buttons.secondary.text[mode],
          borderColor: theme.buttons.secondary.border?.[mode] || "transparent",
        }}
        className="p-2 rounded-full"
        title="Remove the current song"
      >
        <X size={20} />
      </button>

      <SetSongDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSetSong={onSetSong}
        theme={theme}
        mode={mode}
      />
    </div>
  );
};

export default AdminControls;
