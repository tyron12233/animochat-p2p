import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, AlertCircle, Loader2 } from "lucide-react";
import { Message, User, VoiceMessage } from "@/src/lib/types";
import { ChatThemeV2 } from "@/src/lib/chat-theme";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Generate random waveform
  useEffect(() => {
    setWaveform(Array.from({ length: 30 }, () => Math.random() * 0.7 + 0.3));
  }, []);

  // Load audio & attach events
  useEffect(() => {
    if (!message.content) {
      setError("No audio content");
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    const audio = new Audio(message.content);
    audioRef.current = audio;

    const onLoaded = () => {
      if (!audioRef.current) return;

      if (audio.duration !== Infinity && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setCurrentTime(audio.currentTime);
      setIsLoading(false);
    };
    const onTimeUpdate = () => {
      if (audio.duration > 0) {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
    };
    const onError = () => {
      setError("Failed to load audio");
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [message.content]);

  // Play/pause side‑effect
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0;
      }
      audioRef.current.play().catch((e) => {
        console.error("Playback error:", e);
        setError("Playback failed");
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoading && !error) {
      setIsPlaying((p) => !p);
    } else {
      console.warn("Cannot toggle play/pause: audio not ready or loading/error state");
      console.log("Loading:", isLoading, "Error:", error, "Duration:", duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      !audioRef.current ||
      !waveformContainerRef.current ||
      !isFinite(duration) ||
      duration <= 0 ||
      isLoading ||
      !!error
    ) {
      console.warn("Cannot seek: audio not ready or loading/error state");
      return;
    }

    const rect = waveformContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (duration * clickX) / width;
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
    >
      {/* Play/Pause / Loading / Error */}
      <button
        onClick={togglePlayPause}
        className="relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          color: bubbleTheme.background[mode],
          backgroundColor: textColor,
        }}
        disabled={isLoading || !!error}
        aria-label={
          isLoading
            ? "Loading voice message"
            : error
            ? "Error loading audio"
            : isPlaying
            ? "Pause voice message"
            : "Play voice message"
        }
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={16} />
        ) : error ? (
          <AlertCircle size={16} />
        ) : isPlaying ? (
          <Pause size={16} fill={bubbleTheme.background[mode]} />
        ) : (
          <Play size={16} fill={bubbleTheme.background[mode]} className="ml-0.5" />
        )}
      </button>

      {/* Waveform + Seek + Timer */}
      <div className="flex-grow flex items-center gap-2 h-8">
        <div
          ref={waveformContainerRef}
          className={`relative flex items-center w-full h-full cursor-pointer ${
            isLoading || error ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleSeek}
        >
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
          {error
            ? "--:--"
            : isPlaying ? `${formatTime(currentTime)}` : formatTime(Number.parseInt(duration.toFixed(0)))}
        </span>
      </div>
    </div>
  );
};



export default VoiceMessageBubble;
