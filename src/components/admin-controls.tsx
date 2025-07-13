import React, { useEffect, useState } from "react";
import { Music, Pause, Play } from "lucide-react";
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
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!isPlaying) {
        return;
    }

    // report progress every second
    const interval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(
                JSON.stringify({
                    event: "music_progress",
                    payload: { progress },
                })
            );
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying])

  const handlePlay = () => {
    if (socket) {
      socket.send(
        JSON.stringify({
          event: "music_play",
          payload: { currentTime: progress },
        })
      );
      play();
    }
  };

  const handlePause = () => {
    if (socket) {
      socket.send(JSON.stringify({ type: "music_pause", payload: {} }));
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
