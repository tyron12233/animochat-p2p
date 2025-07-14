import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Music,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ChatThemeV2 } from "../lib/chat-theme";
import { Song } from "../lib/types";
import { QueueDialog } from "./chat/queue-dialog";
import { MusicSearchDialog } from "./chat/music-search-dialog";


interface SharedMusicPlayerProps {
  songName: string;
  artistName: string;
  currentTime: number; // in seconds
  duration: number; // in seconds
  isMuted: boolean;
  playbackBlocked: boolean;
  isAdmin: boolean;
  queue: Song[];
  onMuteToggle: () => void;
  onSeek: (time: number) => void;
  onUnblockPlayback: () => void;
  onAddSong: (song: Song) => void;
  theme: ChatThemeV2;
  mode: "light" | "dark";
  // Props for skip functionality
  onSkip: () => void;
  skipVotes: number;
  skipThreshold: number;
  hasVotedToSkip: boolean;
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
  onSkip,
  skipVotes,
  skipThreshold,
  hasVotedToSkip,
  queue,
  onAddSong,
}) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
  const remainingVotes = skipThreshold - skipVotes;

  return (
    <div
      className="flex items-center gap-4 p-4 shadow-lg relative rounded-lg"
      style={{
        background: theme.header.background[mode],
        color: theme.header.statusValue[mode],
        borderBottom: `1px solid ${theme.header.border[mode]}`,
      }}
    >
      {playbackBlocked && (
        <div
          className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10 cursor-pointer rounded-lg"
          onClick={onUnblockPlayback}
        >
          <p className="text-white text-lg font-semibold animate-pulse">
            Tap to listen
          </p>
        </div>
      )}

      {/* Album Art */}
      {/* <div
        className="w-16 h-16 rounded-md flex-shrink-0 flex items-center justify-center"
        style={{
          background: `linear-gradient(45deg, ${theme.buttons.primary.background[mode]}, ${theme.buttons.secondary.background[mode]})`,
        }}
      >
        <Music size={32} style={{ color: theme.buttons.primary.text[mode] }} />
      </div> */}

      <div className="ml-2 flex-grow flex flex-col justify-center min-w-0">
        {/* Song & artist & Controls */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-grow min-w-0">
            <div className="font-bold text-base truncate">{songName}</div>
            <div
              className="text-sm opacity-80 truncate"
              style={{ color: theme.header.statusLabel[mode] }}
            >
              {artistName}
            </div>
          </div>

          {/* Controls Container */}
          <div className="flex items-center flex-shrink-0 gap-2">
            {!isCollapsed && (
              <>
                {/* Skip Button and Vote Counter */}
                {skipThreshold > 0 && (
                  <div className="flex items-center gap-2">
                    {skipVotes > 0 && remainingVotes > 0 && (
                      <span
                        className="text-xs font-medium p-1 rounded-md"
                        style={{
                          color: theme.buttons.primary.text[mode],
                          backgroundColor:
                            theme.buttons.primary.background[mode],
                        }}
                      >
                        {remainingVotes} left
                      </span>
                    )}
                    <button
                      onClick={onSkip}
                      disabled={hasVotedToSkip}
                      title={
                        hasVotedToSkip
                          ? "You have voted to skip"
                          : "Vote to skip song"
                      }
                      className="p-2 rounded-full hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor:
                          theme.buttons.secondary.background[mode],
                        color: theme.buttons.secondary.text[mode],
                      }}
                    >
                      <SkipForward size={20} />
                    </button>
                  </div>
                )}

                {/* Mute Button */}
                <button
                  onClick={onMuteToggle}
                  title={isMuted ? "Unmute" : "Mute"}
                  className="p-2 rounded-full hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: theme.buttons.secondary.background[mode],
                    color: theme.buttons.secondary.text[mode],
                  }}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <QueueDialog queue={queue} theme={theme} mode={mode} />
                <MusicSearchDialog
                  onAddSong={onAddSong}
                  theme={theme}
                  mode={mode}
                />
              </>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand" : "Collapse"}
              className="p-2 rounded-full hover:scale-110 transition-transform"
              style={{
                backgroundColor: theme.buttons.secondary.background[mode],
                color: theme.buttons.secondary.text[mode],
              }}
            >
              {isCollapsed ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronUp size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Seek bar & Time stamps */}
        <div
          className={`w-full mt-2 transition-all duration-300 ease-in-out overflow-hidden ${
            isCollapsed ? "max-h-0" : "max-h-20"
          }`}
        >
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
              className="w-4 h-4 rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transform transition-transform group-hover:scale-110"
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
