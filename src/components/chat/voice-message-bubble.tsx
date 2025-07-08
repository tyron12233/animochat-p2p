import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, AlertCircle, Loader2 } from "lucide-react";
import { Message, User, VoiceMessage } from "@/src/lib/types";
import { ChatThemeV2 } from "@/src/lib/chat-theme";

const MAX_DURATION = 15;

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate waveform on mount
  useEffect(() => {
    setWaveform(Array.from({ length: 30 }, () => Math.random() * 0.7 + 0.3));
  }, []);

  const initializeAudio = () => {
    if (!message.content || isInitialized || audioRef.current) return;

    setIsLoading(true);
    setError(null);

    const audio = new Audio(message.content);
    audioRef.current = audio;

    const onLoaded = () => {
      if (!audioRef.current) return;

      const cappedDuration = Math.min(audio.duration, MAX_DURATION);
      setDuration(cappedDuration);
      setCurrentTime(audio.currentTime);
      setIsLoading(false);
      setIsInitialized(true);
    };

    const onTimeUpdate = () => {
      if (!audioRef.current) return;
      const curr = Math.min(audio.currentTime, MAX_DURATION);
      setCurrentTime(curr);
      setProgress((curr / MAX_DURATION) * 100);
    };

    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      setError("Failed to load audio");
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    // Cleanup
    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isInitialized) initializeAudio();

    setTimeout(() => {
      if (audioRef.current && !isLoading && !error) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          if (audioRef.current.ended) {
            audioRef.current.currentTime = 0;
          }
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch((e) => {
            console.error("Playback error:", e);
            setError("Playback failed");
            setIsPlaying(false);
          });
        }
      }
    }, 50); // slight delay to allow Safari to register interaction
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      !audioRef.current ||
      !waveformContainerRef.current ||
      !isFinite(duration) ||
      duration <= 0 ||
      isLoading ||
      !!error
    ) return;

    const rect = waveformContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = Math.min((duration * clickX) / width, MAX_DURATION);
    audioRef.current.currentTime = newTime;
  };

  // Update UI colors
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

  return (
    <div
      className={`${roundedCorners} px-3 py-2 flex items-center gap-3 w-64 md:w-72`}
      style={{
        background: bubbleTheme.background[mode],
        color: textColor,
      }}
    >
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

      {/* Waveform + Time */}
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
            : formatTime(isPlaying ? currentTime : Math.min(duration, MAX_DURATION))}
        </span>
      </div>
    </div>
  );
};



export default VoiceMessageBubble;
