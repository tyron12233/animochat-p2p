import { useState, useEffect, useRef } from "react";
import { PeerConnectionPacket, Song } from "../lib/types";

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

/**
 * Represents the data received from the 'music_skip_result' WebSocket event.
 */
interface MusicSkipResultPayload {
  skipVotes: number;
  skipThreshold: number;
}

export interface MusicInfo {
  currentSong?: Song;
  progress: number;
  state: "playing" | "paused";
  playTime?: number;
  queue?: Song[];
  skipVotes?: { userId: string }[];
  skipThreshold?: number;
}

export type MusicAddQueuePacket = PeerConnectionPacket<Song, "music_add_queue">;
export type MusicSetPacket = PeerConnectionPacket<Song, "music_set">;
export type MusicPausePacket = PeerConnectionPacket<null, "music_pause">;
export type MusicSeekPacket = PeerConnectionPacket<
  MusicSeekPayload,
  "music_seek"
>;
export type MusicPlayPacket = PeerConnectionPacket<
  MusicPlayPayload,
  "music_play"
>;
export type MusicSkipRequestPacket = PeerConnectionPacket<
  null,
  "music_skip_request"
>;
export type MusicSkipResultPacket = PeerConnectionPacket<
  MusicSkipResultPayload,
  "music_skip_result"
>;

/**
 * The return type of the useSharedAudioPlayer hook.
 */
interface SharedAudioPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  duration: number;
  currentSong: Song | null;
  playbackBlocked: boolean;
  queue: Song[];
  setSong: (song: Song) => void;
  toggleMute: () => void;
  play: () => void;
  unblockPlayback: () => void;
  skipVotes: number;
  skipThreshold: number;
  hasVotedToSkip: boolean;
  voteToSkip: () => void;
  addToQueue: (song: Song) => void;
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
  const [queue, setQueue] = useState<Song[]>([]);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [skipVotes, setSkipVotes] = useState(0);
  const [skipThreshold, setSkipThreshold] = useState(1);
  const [hasVotedToSkip, setHasVotedToSkip] = useState(false);

  const play = () => {
    if (audioRef.current) {
      console.log("Playing audio:", currentSong?.name);
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.error("Error playing audio:", e);
          setIsPlaying(false);
        });
    }
  };

  const unblockPlayback = () => {
    if (playbackBlocked && audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setPlaybackBlocked(false);
        })
        .catch((e) => {
          console.error("Error unblocking audio playback:", e);
          setIsPlaying(false);
        });
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
        const packet: PeerConnectionPacket<any, string> = JSON.parse(
          messageEvent.data
        );

        switch (packet.type) {
          case "music_sync":
            console.log("Received music_sync packet:", packet);
            const musicInfo = packet.content as MusicInfo;

            setQueue(musicInfo.queue ?? []);
            setSkipVotes(musicInfo.skipVotes?.length ?? 0);
            setSkipThreshold(musicInfo.skipThreshold ?? 1);

            if (musicInfo.currentSong) {
              if (musicInfo.currentSong.url !== currentSong?.url) {
                setCurrentSong(musicInfo.currentSong);
                audio.src = musicInfo.currentSong.url;
              }

              const serverProgress =
                musicInfo.state === "playing" && musicInfo.playTime
                  ? musicInfo.progress + (Date.now() - musicInfo.playTime) / 1000
                  : musicInfo.progress;

              audio.currentTime = serverProgress;
              setProgress(serverProgress);

              if (musicInfo.state === "playing") {
                audio
                  .play()
                  .then(() => {
                    setIsPlaying(true);
                    setPlaybackBlocked(false);
                  })
                  .catch((e) => {
                    console.error("Error playing audio on sync:", e);
                    if (e.name === "NotAllowedError") {
                      setPlaybackBlocked(true);
                    }
                    setIsPlaying(false);
                  });
              } else {
                audio.pause();
                setIsPlaying(false);
              }
            } else {
              setCurrentSong(null);
              audio.src = "";
              setIsPlaying(false);
              setProgress(0);
              setDuration(0);
            }
            break;
          case "music_set":
            const content = packet.content as { song: Song | undefined, queue?: Song[] };
            if (content.song) {
              console.log("Received music_set for song:", content.song.name);
              setCurrentSong(content.song);
              audio.src = content.song.url;
              audio.currentTime = content.song.progress ?? 0;
              setProgress(content.song.progress ?? 0);
              setDuration(0); 
              play();
            } else {
              console.log("Received music_set with no song, resetting player.");
              setCurrentSong(null);
              audio.src = "";
              setIsPlaying(false);
              setProgress(0);
              setDuration(0);
            }
            break;

          case "music_play":
            const playPayload = packet.content as MusicPlayPayload;
            console.log("Received music_play at:", playPayload.currentTime);
            audio.currentTime = playPayload.currentTime;
            audio
              .play()
              .then(() => {
                setIsPlaying(true);
                setPlaybackBlocked(false);
              })
              .catch((e) => {
                console.error("Error playing audio:", e);
                if (e.name === "NotAllowedError") {
                  setPlaybackBlocked(true);
                }
                setIsPlaying(false);
              });
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

          case "music_skip_result":
            const skipResultPayload = packet.content as MusicSkipResultPayload;
            console.log("Received music_skip_result:", skipResultPayload);
            setSkipVotes(skipResultPayload.skipVotes);
            setSkipThreshold(skipResultPayload.skipThreshold);
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
    socket.addEventListener("close", () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    });
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

  const addToQueue = (song: Song) => {
    if (socket) {
      console.log("Sending music_add_queue", song);
      socket.send(JSON.stringify({ type: "music_add_queue", content: song }));
    }
  };

  const voteToSkip = () => {
    if (socket) {
      console.log("Sending music_skip_request");
      socket.send(JSON.stringify({ type: "music_skip_request" }));
      setHasVotedToSkip(true);
    }
  };

  return {
    isPlaying,
    isMuted,
    setSong: (song: Song) => {
      if (socket) {
        socket.send(JSON.stringify({ type: "music_set", content: song }));
      }
      setCurrentSong(song);
      setProgress(song.progress ?? 0);
    },
    progress,
    duration,
    currentSong,
    toggleMute,
    play,
    playbackBlocked,
    unblockPlayback,
    skipVotes,
    skipThreshold,
    hasVotedToSkip,
    voteToSkip,
    queue,
    addToQueue,
  };
};
