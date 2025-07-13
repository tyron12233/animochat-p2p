import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { ChatThemeV2 } from "../lib/chat-theme";

interface SharedMusicPlayerProps {
  songName: string;
  artistName: string;
  currentTime: number; // in seconds
  duration: number; // in seconds
  isMuted: boolean;
  playbackBlocked: boolean;
  onMuteToggle: () => void;
  onSeek: (time: number) => void;
  onUnblockPlayback: () => void;
  theme: ChatThemeV2;
  mode: "light" | "dark";
}

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const SharedMusicPlayer: React.FC<SharedMusicPlayerProps> = ({
  songName,
  artistName,
  currentTime,
  duration,
  isMuted,
  onMuteToggle,
  onSeek,
  theme,
  mode,
  playbackBlocked,
  onUnblockPlayback,
}) => {
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="flex items-center gap-4 p-4 border-b shadow-sm relative"
      style={{
        background: theme.header.background[mode],
        borderColor: theme.header.border[mode],
        color: theme.header.statusValue[mode],
      }}
    >
      {playbackBlocked && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 cursor-pointer"
          onClick={onUnblockPlayback}
        >
          <p className="text-white text-lg font-semibold">Tap to listen</p>
        </div>
      )}
      <div className="flex-grow">
        {/* Song & artist */}
        <div className="flex justify-between items-center">
          <div>
            <div className="font-semibold text-sm">{songName}</div>
            <div
              className="text-xs opacity-80"
              style={{ color: theme.header.statusLabel[mode] }}
            >
              {artistName}
            </div>
          </div>
          <button
            onClick={onMuteToggle}
            className="p-2 rounded-full hover:scale-110 transition-transform"
            style={{
              backgroundColor: theme.buttons.secondary.background[mode],
              color: theme.buttons.secondary.text[mode],
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        {/* Time stamps */}
        <div className="flex justify-between text-xs mt-2 opacity-80">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Seek bar */}
        <div className="relative w-full mt-1">
          <div
            className="h-2 rounded-full"
            style={{
              background: theme.messageList.scrollbarTrack[mode],
            }}
          />
          <div
            className="h-2 rounded-full absolute top-0 left-0 transform origin-left transition-all"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${theme.buttons.primary.background[mode]} 0%, ${theme.buttons.primary.background[mode]} 70%, transparent 100%)`,
            }}
          />
          {/* Draggable thumb */}
          <button
            className="w-3 h-3 rounded-full absolute top-1/2 -translate-y-1/2 transform hover:scale-125 transition-transform"
            style={{
              left: `${progressPercent}%`,
              backgroundColor: theme.buttons.primary.background[mode],
            }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSeek((progressPercent / 100) * duration)}
          />
        </div>
      </div>
    </div>
  );
};

export default SharedMusicPlayer;
