import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ChatThemeV2 } from "../lib/chat-theme";
import { Song } from "../lib/types";
import { QueueDialog } from "./chat/queue-dialog";
import { MusicSearchDialog } from "./chat/music-search-dialog";
import { motion, AnimatePresence } from "framer-motion";

// --- PROPS INTERFACE ---
interface SharedMusicPlayerProps {
  songName: string;
  artistName: string;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  playbackBlocked: boolean;
  playbackError: string | null;
  isAdmin: boolean;
  queue: Song[];
  onMuteToggle: () => void;
  onSeek: (time: number) => void;
  onUnblockPlayback: () => void;
  onAddSong: (song: Song) => void;
  theme: ChatThemeV2;
  mode: "light" | "dark";
  onSkip: () => void;
  skipVotes: number;
  skipThreshold: number;
  hasVotedToSkip: boolean;
}

// --- HELPER FUNCTIONS ---
const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

// --- CONSISTENT ICON BUTTON ---
const IconButton = ({
  onClick,
  title,
  disabled = false,
  children,
  style,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <motion.button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className="p-2 rounded-full transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
    style={style}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
  >
    {children}
  </motion.button>
);

// --- MAIN COMPONENT ---
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
      callback?.(newTime);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => isSeeking && handleSeek(e);
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
  const buttonStyle = {
    backgroundColor: theme.buttons.secondary.background[mode],
    color: theme.buttons.secondary.text[mode],
  };

  return (
    <motion.div
      className="relative px-4 transition-all duration-300 ease-in-out"
      style={{
        paddingTop: isCollapsed ? "0.5rem" : "1rem",
        paddingBottom: isCollapsed ? "0.5rem" : "1rem",
        background: theme.header.background[mode],
        color: theme.header.statusValue[mode],
        borderBottom: `1px solid ${theme.header.border[mode]}`,
      }}
      animate={{
        paddingTop: isCollapsed ? "0.5rem" : "1rem",
        paddingBottom: isCollapsed ? "0.5rem" : "1rem",
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* --- Playback Blocker --- */}
      <AnimatePresence>
        {playbackBlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-lg bg-black bg-opacity-60"
            onClick={onUnblockPlayback}
          >
            <p className="animate-pulse text-lg font-semibold text-white">
              Tap to listen
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Top Section: Info & Collapse Button --- */}
      <div className="flex w-full items-center justify-between gap-4">
        <div className="min-w-0 flex-grow">
          <p className="truncate font-bold">{songName}</p>
          {!isCollapsed && (
            <p
              className="truncate text-sm opacity-80"
              style={{ color: theme.header.statusLabel[mode] }}
            >
              {artistName}
            </p>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="expanded-controls"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94],
                opacity: { duration: 0.3 },
                scale: { duration: 0.4 },
                y: { duration: 0.4 }
              }}
              className="overflow-hidden"
            >
              {/* --- Controls --- */}
              <motion.div 
                className="mt-2 flex items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {skipThreshold > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    <IconButton
                      onClick={onSkip}
                      disabled={hasVotedToSkip}
                      title={
                        hasVotedToSkip
                          ? "You have voted to skip"
                          : `Vote to skip (${remainingVotes} more needed)`
                      }
                      style={buttonStyle}
                    >
                      <SkipForward size={20} />
                    </IconButton>
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <IconButton
                    onClick={onMuteToggle}
                    title={isMuted ? "Unmute" : "Mute"}
                    style={buttonStyle}
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </IconButton>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  <QueueDialog queue={queue} theme={theme} mode={mode} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <MusicSearchDialog
                    onAddSong={onAddSong}
                    theme={theme}
                    mode={mode}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <IconButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand" : "Collapse"}
              style={buttonStyle}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </motion.div>
            </IconButton>
          </motion.div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div 
            key="progress-section"
            className="w-full pt-6 px-2"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.25, 0.46, 0.45, 0.94],
              opacity: { duration: 0.4 },
              y: { duration: 0.5 },
              scale: { duration: 0.5 }
            }}
          >
            <motion.div
              ref={progressBarRef}
              className={`relative h-2 w-full ${
                isAdmin ? "cursor-pointer" : "cursor-default"
              }`}
              onMouseDown={isAdmin ? handleMouseDown : undefined}
              initial={{ scaleX: 0.9 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            >
              <div
                className="h-full rounded-full transition-all duration-200 ease-out"
                style={{
                  background: theme.messageList.scrollbarTrack[mode],
                }}
              />
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  background: theme.buttons.primary.background[mode],
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              />
              <motion.div
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 transform rounded-full transition-all duration-200 ease-out hover:scale-110"
                style={{
                  left: `${progressPercent}%`,
                  backgroundColor: theme.buttons.primary.background[mode],
                  boxShadow: "0 0 5px rgba(0,0,0,0.3)",
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            </motion.div>
            <motion.div 
              className="mt-1 flex justify-between text-xs opacity-80"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
            >
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                {formatTime(displayTime)}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                {formatTime(duration)}
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SharedMusicPlayer;
