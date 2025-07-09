import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, AlertCircle, Loader2 } from "lucide-react";
import { VoiceMessage } from "@/src/lib/types";
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

    const base64String = message.content;
    if (!base64String.startsWith("data:audio/")) {
      setError("Invalid audio data format");
      setIsLoading(false);
      return;
    }

    // Decode the Base64 string
    function base64ToBlob(base64: string, mimeType: string) {
      const byteCharacters = atob(base64);

      // Create an ArrayBuffer to hold the binary data
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Create a Blob from the ArrayBuffer
      const blob = new Blob([byteArray], { type: mimeType });
      return blob;
    }

    const blob = base64ToBlob(
      base64String.split(",")[1], // Remove the data URL prefix
      "audio/webm" // Assuming the audio is in 
    );

    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);
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
      const errorMessage =
        audioRef.current?.error?.message || "An unknown error occurred";
      setError("Failed to load audio: " + errorMessage);
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    // Cleanup
    return () => {
      
      // clean up url
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
      }

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

    if (!isInitialized) {
      initializeAudio();
      // On first click, initialize and then wait for user to click again to play.
      // This is a common pattern to deal with browser autoplay restrictions.
      return;
    }

    if (audioRef.current && !isLoading && !error) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (audioRef.current.ended) {
          audioRef.current.currentTime = 0;
        }
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((e) => {
            console.error("Playback error:", e);
            setError("Playback failed: " + e.message);
            setIsPlaying(false);
          });
      }
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
    )
      return;

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
      {error ? (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={16} />
          <span className="text-xs font-mono">{error}</span>
        </div>
      ) : (
        <button
          onClick={togglePlayPause}
          className="relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            color: bubbleTheme.background[mode],
            backgroundColor: textColor,
          }}
          disabled={isLoading}
          aria-label={
            isLoading
              ? "Loading voice message"
              : isPlaying
              ? "Pause voice message"
              : "Play voice message"
          }
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : isPlaying ? (
            <Pause size={16} fill={bubbleTheme.background[mode]} />
          ) : (
            <Play
              size={16}
              fill={bubbleTheme.background[mode]}
              className="ml-0.5"
            />
          )}
        </button>
      )}

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
            : formatTime(
                isPlaying ? currentTime : Math.min(duration, MAX_DURATION)
              )}
        </span>
      </div>
    </div>
  );
};

export default VoiceMessageBubble;
