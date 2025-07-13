import { useState, useEffect, useRef } from "react";
import { PeerConnectionPacket } from "../lib/types";

/**
 * Represents the structure of a song object.
 */
interface Song {
  name: string;
  url: string;
}

/**
 * Represents the data received from the 'music_play' WebSocket event.
 */
interface MusicPlayPayload {
  currentTime: number;
}

/**
 * Represents the data received from the 'music_seek' WebSocket event.
 */
interface MusicSeekPayload {
  seekTime: number;
}


export type MusicSetPacket = PeerConnectionPacket<Song, "music_set">;
export type MusicPausePacket = PeerConnectionPacket<null, "music_pause">;
export type MusicSeekPacket = PeerConnectionPacket<MusicSeekPayload, "music_seek">;
export type MusicPlayPacket = PeerConnectionPacket<MusicPlayPayload, "music_play">

/**
 * The return type of the useSharedAudioPlayer hook.
 */
interface SharedAudioPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  duration: number;
  currentSong: Song | null;
  setSong: (song: Song) => void;
  toggleMute: () => void;
  play: () => void;
}

/**
 * A custom hook to manage a shared audio player controlled by a standard WebSocket connection.
 * It handles audio state, playback, and local muting.
 *
 * @param {WebSocket | null} socket - The native browser WebSocket instance for server communication.
 * @returns {SharedAudioPlayerState} The state of the audio player and functions to control it.
 */
export const useSharedAudioPlayer = (
  socket: WebSocket | null
): SharedAudioPlayerState => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const play = () => {
    if (audioRef.current) {
        console.log("Playing audio:", currentSong?.name);
      audioRef.current.play().catch((e) => console.error("Error playing audio:", e));
      setIsPlaying(true);
    }
  };

  // Initialize the Audio element and set its muted state
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.muted = isMuted;
  }, [isMuted]);

  // Main effect for handling WebSocket and audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!socket || !audio) return;

    /**
     * Parses incoming messages from the WebSocket server and routes them
     * to the appropriate handler based on the 'event' property.
     * @param {MessageEvent} messageEvent The event object from the WebSocket message listener.
     */
    const handleWebSocketMessage = (messageEvent: MessageEvent) => {
      try {
        const packet: PeerConnectionPacket<any, string> = JSON.parse(messageEvent.data);

        switch (packet.type) {
          case "music_set":
            const song = packet.content as Song | undefined;
            if (!song) {
                break;
            }

            console.log("Received music_set:", song);
            setCurrentSong(song);
            audio.src = song.url;
            setIsPlaying(false);
            break;

          case "music_play":
            const playPayload = packet.content as MusicPlayPayload;
            console.log("Received music_play at:", playPayload.currentTime);
            audio.currentTime = playPayload.currentTime;
            audio.play().catch((e) => console.error("Error playing audio:", e));
            setIsPlaying(true);
            break;

          case "music_pause":
            console.log("Received music_pause");
            audio.pause();
            setIsPlaying(false);
            break;

          case "music_seek":
            const seekPayload = packet.content as MusicSeekPayload;
            console.log("Received music_seek to:", seekPayload.seekTime);
            audio.currentTime = seekPayload.seekTime;
            break;
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    // --- Audio Element Event Handlers ---
    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handlePlaybackEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    // --- Registering Event Listeners ---
    socket.addEventListener("message", handleWebSocketMessage);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handlePlaybackEnded);

    // --- Cleanup Function ---
    return () => {
      socket.removeEventListener("message", handleWebSocketMessage);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handlePlaybackEnded);
    };
  }, [socket]);

  /**
   * Toggles the muted state of the audio for the local user.
   */
  const toggleMute = () => {
    setIsMuted((prevMuted) => {
      const newMutedState = !prevMuted;
      if (audioRef.current) {
        audioRef.current.muted = newMutedState;
      }
      return newMutedState;
    });
  };

  return {
    isPlaying,
    isMuted,
    setSong: (song: Song) => {
      if (socket) {
        socket.send(JSON.stringify({ type: "music_set", content: song }));
      }
      setCurrentSong(song);
      if (audioRef.current) {
        audioRef.current.src = song.url;
        audioRef.current.load();
      }
      setProgress(0);
    },
    progress,
    duration,
    currentSong,
    toggleMute,
    play,
  };
};
