import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, PlusCircle } from "lucide-react";
import { Song } from "../../lib/types";
import Spinner from "../ui/spinner";

const ARCHIVE_API_URL = "https://archive.org/";

interface MusicSearchDialogProps {
  onAddSong: (song: Song) => void;
  theme: any;
  mode: "light" | "dark";
}

interface ArchiveTrack {
  identifier: string;
  title: string;
  creator: string | string[];
}

export const MusicSearchDialog: React.FC<MusicSearchDialogProps> = ({
  onAddSong,
  theme,
  mode,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ArchiveTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    setIsLoading(true);
    setSearchResults([]);
    try {
      const response = await fetch(
        `${ARCHIVE_API_URL}advancedsearch.php?q=title:(${encodeURIComponent(
          searchQuery
        )}) AND mediatype:(audio)&fl[]=identifier,title,creator&rows=50&output=json`
      );
      const data = await response.json();
      if (data.response && data.response.docs) {
        setSearchResults(data.response.docs);
      }
    } catch (error) {
      console.error("Error fetching from Internet Archive API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSong = async (track: ArchiveTrack) => {
    setIsAdding(track.identifier);
    try {
      const metaResponse = await fetch(
        `${ARCHIVE_API_URL}metadata/${track.identifier}`
      );
      const metaData = await metaResponse.json();

      if (metaData && metaData.files) {
        const mp3File = metaData.files.find((f: any) =>
          f.name.endsWith(".mp3")
        );

        if (mp3File) {
          const creator = Array.isArray(track.creator)
            ? track.creator.join(", ")
            : track.creator;
          const newSong: Song = {
            name: `${track.title} - ${creator || "Unknown Artist"}`,
            url: `https://archive.org/download/${track.identifier}/${mp3File.name}`,
          };
          onAddSong(newSong);
        } else {
          console.error("No MP3 file found for this track.");
          // You could add a user-facing error message here
        }
      }
    } catch (error) {
      console.error("Error fetching metadata from Internet Archive:", error);
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Add song to queue">
          <PlusCircle />
        </Button>
      </DialogTrigger>
      <DialogContent
        style={{
          background: theme.header.background[mode],
          color: theme.header.statusValue[mode],
          border: `1px solid ${theme.header.border[mode]}`,
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Song to Queue from Archive.org</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a song..."
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Spinner /> : "Search"}
          </Button>
        </div>
        <div className="mt-4 max-h-60 overflow-y-auto">
          {searchResults.length > 0 ? (
            <ul>
              {searchResults.map((track) => (
                <li
                  key={track.identifier}
                  className="flex items-center justify-between p-2 border-b"
                  style={{ borderColor: theme.header.border[mode] }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Music size={16} className="flex-shrink-0" />
                    <span className="truncate">
                      {track.title} by{" "}
                      {Array.isArray(track.creator)
                        ? track.creator.join(", ")
                        : track.creator || "Unknown Artist"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleAddSong(track)}
                    disabled={isAdding === track.identifier}
                  >
                    {isAdding === track.identifier ? (
                      <Spinner />
                    ) : (
                      <PlusCircle size={16} />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && <p>No results found.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
