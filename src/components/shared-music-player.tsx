import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { ChatThemeV2 } from "../lib/chat-theme";

interface SharedMusicPlayerProps {
  songName: string;
  artistName: string;
  progress: number; // A value between 0 and 100
  isMuted: boolean;
  onMuteToggle: () => void;
  theme: ChatThemeV2;
  mode: "light" | "dark";
}

/**
 * A UI component for a shared music player in a group chat.
 * It displays the currently playing song, its progress, and a mute button for the local user.
 * @param {SharedMusicPlayerProps} props The props for the component.
 * @returns {JSX.Element} The rendered music player UI.
 */
const SharedMusicPlayer: React.FC<SharedMusicPlayerProps> = ({
  songName,
  artistName,
  progress,
  isMuted,
  onMuteToggle,
  theme,
  mode,
}) => {
  return (
    <div
      style={{
        background: theme.header.background[mode],
        borderColor: theme.header.border[mode],
        color: theme.header.statusValue[mode],
      }}
      className="p-3 flex items-center gap-4 border-b"
    >
      <div className="flex-grow">
        <div className="font-bold text-sm">{songName}</div>
        <div
          style={{ color: theme.header.statusLabel[mode] }}
          className="text-xs"
        >
          {artistName}
        </div>
        <div
          style={{ backgroundColor: theme.messageList.scrollbarTrack[mode] }}
          className="w-full rounded-full h-1.5 mt-2"
        >
          <div
            style={{
              backgroundColor: theme.buttons.primary.background[mode],
              width: `${progress}%`,
            }}
            className="h-1.5 rounded-full"
          ></div>
        </div>
      </div>
      <button
        onClick={onMuteToggle}
        className="p-2 rounded-full transition-colors"
        style={{
            backgroundColor: theme.buttons.secondary.background[mode],
            color: theme.buttons.secondary.text[mode],
        }}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
};

export default SharedMusicPlayer;