import React, { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Message, User, VoiceMessage } from "@/src/lib/types"; // Assuming types are in this path
import { ChatThemeV2 } from "@/src/lib/chat-theme"; // Assuming theme is in this path

// Helper function to format time from seconds to MM:SS
const formatTime = (time: number) => {
  if (isNaN(time) || time === Infinity || time < 0) {
    return "0:00";
  }
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

interface VoiceMessageProps {
  message: VoiceMessage;
  theme: ChatThemeV2;
  mode: "light" | "dark";
  isUserMessage: boolean;
  roundedCorners: string;
}

const VoiceMessageBubble: React.FC<VoiceMessageProps> = ({
  message,
  theme,
  isUserMessage,
  roundedCorners,
  mode,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);

  const bubbleTheme = isUserMessage
    ? theme.message.myMessage
    : theme.message.strangerMessage;
  const textColor = bubbleTheme.text[mode];
  const waveformPlayedColor = isUserMessage
    ? textColor
    : theme.accent.main[mode];
  const waveformUnplayedColor = isUserMessage
    ? `${textColor}55`
    : `${theme.accent.main[mode]}55`;

  // Generate a static, random waveform shape on mount
  useEffect(() => {
    const generateWaveform = () => {
      const bars = Array.from({ length: 30 }, () => Math.random() * 0.7 + 0.3);
      setWaveform(bars);
    };
    generateWaveform();
  }, []);

  // Effect for handling audio source and events
  useEffect(() => {
    let audioUrl = "";
    
    if (message.content) {
      // base64 encoded string
        audioUrl = `${message.content}`;
    } else {
      console.error(
        "Unsupported message content type for audio:",
        typeof message.content
      );
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const updateProgress = () => {
      if (audio.duration > 0) {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handlePlaybackEnd = () => {
      setIsPlaying(false);
      // Don't reset progress to 0, so the waveform stays filled
    };

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handlePlaybackEnd);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handlePlaybackEnd);
      audioRef.current = null;
    };
  }, [message.content]);

  // Effect for controlling play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // If playback finished, restart from beginning
        if (audioRef.current.ended) {
          audioRef.current.currentTime = 0;
        }
        audioRef.current.play().catch((e) => {
          console.error("Error playing audio:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (duration > 0) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (
      !audioRef.current ||
      !waveformContainerRef.current ||
      !isFinite(duration) ||
      duration <= 0
    ) {
      return;
    }

    const rect = waveformContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekPercentage = (clickX / width) * 100;

    const newTime = (duration * seekPercentage) / 100;
    if (isFinite(newTime)) {
      audioRef.current.currentTime = newTime;
    }
  };

  return (
    <div
      className={`${roundedCorners} px-3 py-2 flex items-center gap-3 w-64 md:w-72`}
      style={{
        background: bubbleTheme.background[mode],
        color: textColor,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          color: bubbleTheme.background[mode],
          backgroundColor: textColor,
        }}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
      >
        {isPlaying ? (
          <Pause size={16} fill={bubbleTheme.background[mode]} />
        ) : (
          <Play
            size={16}
            fill={bubbleTheme.background[mode]}
            className="ml-0.5"
          />
        )}
      </button>

      {/* Waveform and Progress */}
      <div className="flex-grow flex items-center gap-2 h-8">
        <div
          ref={waveformContainerRef}
          className="relative flex items-center w-full h-full cursor-pointer"
          onClick={handleSeek}
        >
          {/* Waveform bars */}
          <div className="flex items-center w-full h-full gap-px">
            {waveform.map((height, i) => (
              <div
                key={i}
                className="w-full rounded-full"
                style={{
                  height: `${height * 60}%`,
                  backgroundColor:
                    i < (progress / 100) * waveform.length
                      ? waveformPlayedColor
                      : waveformUnplayedColor,
                  transition: "background-color 0.2s ease",
                }}
              />
            ))}
          </div>
          {/* Seek Handle */}
          <div
            className="absolute w-3 h-3 rounded-full border-2"
            style={{
              left: `calc(${progress}% - 6px)`,
              backgroundColor: bubbleTheme.background[mode],
              borderColor: waveformPlayedColor,
              transition: "left 0.1s linear",
              boxShadow: "0 0 4px rgba(0,0,0,0.2)",
            }}
          />
        </div>
        <span
          className="text-xs font-mono w-12 text-right"
          style={{ color: textColor, opacity: 0.8 }}
        >
          {formatTime(duration - currentTime)}
        </span>
      </div>
    </div>
  );
};

export default VoiceMessageBubble;
