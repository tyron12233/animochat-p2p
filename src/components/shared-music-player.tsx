import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  SkipForward,
  Volume2,
  VolumeX,
  MoreHorizontal,
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

// --- CONTROLS MENU COMPONENT ---
const ControlsMenu = ({
  isOpen,
  onClose,
  theme,
  mode,
  onSkip,
  skipVotes,
  skipThreshold,
  hasVotedToSkip,
  onMuteToggle,
  isMuted,
  queue,
  onAddSong,
}: {
  isOpen: boolean;
  onClose: () => void;
  theme: ChatThemeV2;
  mode: "light" | "dark";
  onSkip: () => void;
  skipVotes: number;
  skipThreshold: number;
  hasVotedToSkip: boolean;
  onMuteToggle: () => void;
  isMuted: boolean;
  queue: Song[];
  onAddSong: (song: Song) => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const remainingVotes = skipThreshold - skipVotes;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-full mt-2 z-20 rounded-lg shadow-lg border min-w-48"
      style={{
        borderColor: theme.header.border[mode],
      }}
    >
      <div className="p-2 space-y-1">
        {skipThreshold > 0 && (
          <button
            onClick={() => {
              onSkip();
              onClose();
            }}
            disabled={hasVotedToSkip}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors disabled:opacity-50"
            style={{
              color: theme.header.statusValue[mode],
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              if (!hasVotedToSkip) {
                e.currentTarget.style.backgroundColor =
                  theme.buttons.secondary.background[mode];
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <SkipForward size={16} />
            <span className="text-sm">
              {hasVotedToSkip
                ? "Voted to skip"
                : `Vote to skip (${remainingVotes} more)`}
            </span>
          </button>
        )}

        <button
          onClick={() => {
            onMuteToggle();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
          style={{
            color: theme.header.statusValue[mode],
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              theme.buttons.secondary.background[mode];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span className="text-sm">{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        <div
          className="border-t pt-1 mt-1"
          style={{ borderColor: theme.header.border[mode] }}
        >
          <div className="px-3 py-2">
            <QueueDialog queue={queue} theme={theme} mode={mode} />
          </div>
          <div className="px-3 py-2">
            <MusicSearchDialog
              onAddSong={onAddSong}
              theme={theme}
              mode={mode}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

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
  const [showControlsMenu, setShowControlsMenu] = useState(false);
  const [useCompactControls, setUseCompactControls] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Check if controls should be compact based on container width
  useEffect(() => {
    const checkWidth = () => {
      if (controlsRef.current) {
        const containerWidth =
          controlsRef.current.parentElement?.clientWidth || 0;
        // If container is less than 400px, use compact controls
        setUseCompactControls(containerWidth < 400);
      }
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

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
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold max">{songName}</p>
          {!isCollapsed && (
            <p
              className="truncate text-sm opacity-80 max-w-[20rem]"
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
                y: { duration: 0.4 },
              }}
              className="overflow-hidden relative"
            >
              {/* --- Controls --- */}
              <motion.div
                ref={controlsRef}
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
                {isCollapsed ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronUp size={20} />
                )}
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
              scale: { duration: 0.5 },
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
