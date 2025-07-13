import React, { useState, useRef, useEffect } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { ChatThemeV2 } from "../lib/chat-theme";

interface SharedMusicPlayerProps {
  songName: string;
  artistName: string;
  currentTime: number; // in seconds
  duration: number; // in seconds
  isMuted: boolean;
  playbackBlocked: boolean;
  isAdmin: boolean;
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
  isAdmin,
}) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleSeek = (
    e: React.MouseEvent<HTMLDivElement> | MouseEvent,
    callback?: (time: number) => void
  ) => {
    if (progressBarRef.current) {
      const { left, width } = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - left;
      const seekRatio = Math.max(0, Math.min(1, clickX / width));
      const newTime = seekRatio * duration;
      setSeekTime(newTime);
      if (callback) {
        callback(newTime);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isSeeking) {
        handleSeek(e);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isSeeking) {
        setIsSeeking(false);
        handleSeek(e, onSeek);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isSeeking, onSeek, duration]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsSeeking(true);
    setSeekTime(currentTime);
    handleSeek(e);
  };

  const displayTime = isSeeking ? seekTime : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div
      className="flex items-center gap-4 p-4 shadow-lg relative"
      style={{
        background: theme.header.background[mode],
        color: theme.header.statusValue[mode],
        borderBottom: `1px solid ${theme.header.border[mode]}`,
      }}
    >
      {playbackBlocked && (
        <div
          className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10 cursor-pointer"
          onClick={onUnblockPlayback}
        >
          <p className="text-white text-lg font-semibold animate-pulse">
            Tap to listen
          </p>
        </div>
      )}

      {/* Album Art */}
      <div
        className="w-16 h-16 rounded-md flex-shrink-0 flex items-center justify-center"
        style={{
          background: `linear-gradient(45deg, ${theme.buttons.primary.background[mode]}, ${theme.buttons.secondary.background[mode]})`,
        }}
      >
        <Music size={32} style={{ color: theme.buttons.primary.text[mode] }} />
      </div>

      <div className="flex-grow flex flex-col justify-center">
        {/* Song & artist */}
        <div className="flex justify-between items-start">
          <div>
            <div className="font-bold text-base truncate">{songName}</div>
            <div
              className="text-sm opacity-80 truncate"
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
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Seek bar & Time stamps */}
        <div className="w-full mt-2">
          <div
            ref={progressBarRef}
            className={`relative w-full h-2 ${
              isAdmin ? "cursor-pointer" : "cursor-default"
            }`}
            onMouseDown={isAdmin ? handleMouseDown : undefined}
          >
            <div
              className="h-full rounded-full"
              style={{
                background: theme.messageList.scrollbarTrack[mode],
              }}
            />
            <div
              className="h-full rounded-full absolute top-0 left-0"
              style={{
                width: `${progressPercent}%`,
                background: theme.buttons.primary.background[mode],
              }}
            />
            <div
              className="w-4 h-4 rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transform transition-transform"
              style={{
                left: `${progressPercent}%`,
                backgroundColor: theme.buttons.primary.background[mode],
                boxShadow: "0 0 5px rgba(0,0,0,0.3)",
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 opacity-80">
            <span>{formatTime(displayTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedMusicPlayer;
