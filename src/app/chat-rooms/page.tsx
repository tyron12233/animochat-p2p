"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  WifiOff,
  ServerCrash,
  PlusCircle,
  X,
  Search,
  MessageCircle,
  Zap,
  Coffee,
  Flame,
  Crown,
  ChevronRight,
  Hash,
  Circle,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GroupChat from "@/src/components/group-chat/group-chat";
import { ChatThemeProvider } from "@/src/context/theme-context";
import { AuthProvider, useAuth } from "@/src/context/auth-context";
import { Message } from "@/src/lib/types";
import { AnimoChatProvider } from "@/src/provider/animochat-provider";

// --- START: Enhanced Components ---

const LoadingSpinner = ({ className }: { className?: string }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{
      duration: 1,
      repeat: Number.POSITIVE_INFINITY,
      ease: "linear",
    }}
    className={`w-4 h-4 border-2 border-green-200 border-t-green-500 rounded-full ${className}`}
  />
);

// --- TYPE DEFINITIONS ---
interface ChatServer {
  timestamp: number;
  url: string;
  version: string;
  status: string;
  serviceName: string;
}

export interface ChatRoom {
  id: string;
  participants: {id: string}[];
  max_participants: number;
  name: string;
  serverUrl: string;
  recent_message?: Message;
}

// --- CONSTANTS ---
const DISCOVERY_SERVICE_URL =
  "https://animochat-service-discovery.onrender.com/discover/chat-service/1.0.0/all";

// Compact Modal
const CreateRoomModal = ({
  isOpen,
  onClose,
  onSubmit,
  isCreating,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, maxParticipants: number) => void;
  isCreating: boolean;
  error: string | null;
}) => {
  const [name, setName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("10");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const maxP = Number.parseInt(maxParticipants, 10);
    if (name.trim() && !isNaN(maxP) && maxP > 1) {
      onSubmit(name.trim(), maxP);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-green-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  New Room
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X size={16} />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Room name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 border-green-200 focus:ring-green-500"
                  required
                  maxLength={50}
                />

                <Input
                  type="number"
                  placeholder="Max participants"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className="h-10 border-green-200 focus:ring-green-500"
                  required
                  min="2"
                  max="100"
                />

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 p-2 rounded">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isCreating}
                >
                  {isCreating ? <LoadingSpinner /> : "Create"}
                </Button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compact Room List Item
const RoomListItem = ({
  room,
  onJoin,
}: {
  room: ChatRoom;
  onJoin: () => void;
}) => {
  const occupancyRate = room.participants.length / room.max_participants;
  const activityLevel =
    occupancyRate < 0.3
      ? { label: "Quiet", icon: Coffee, color: "text-blue-500 bg-blue-50" }
      : occupancyRate < 0.6
      ? { label: "Active", icon: Zap, color: "text-green-500 bg-green-50" }
      : occupancyRate < 0.8
      ? { label: "Buzzing", icon: Flame, color: "text-orange-500 bg-orange-50" }
      : {
          label: "Popular",
          icon: Crown,
          color: "text-purple-500 bg-purple-50",
        };

  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
      }}
      whileHover={{ backgroundColor: "rgba(16, 185, 129, 0.02)" }}
      className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-green-50/30 cursor-pointer transition-colors group"
      onClick={onJoin}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Hash size={16} className="text-green-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate">{room.name}</h3>
            <div
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${activityLevel.color}`}
            >
              <div className="flex items-center gap-1">
                <activityLevel.icon size={10} />
                {activityLevel.label}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>
                {room.participants.length}/{room.max_participants}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${occupancyRate * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs">
                {Math.round(occupancyRate * 100)}%
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-500 gap-4 mt-2">
            {room.recent_message && (
              <span>
                <b>
                  {(room.recent_message as any)?.senderNickname ?? "Someone"}
                </b>
                : {room.recent_message.content}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Circle size={6} className="text-green-500 fill-current" />
          <span className="text-xs text-gray-500">Online</span>
        </div>
        <ChevronRight
          size={16}
          className="text-gray-400 group-hover:text-green-500 transition-colors"
        />
      </div>
    </motion.div>
  );
};

// Compact FeedbackState
const FeedbackState = ({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center text-center py-16 px-8"
  >
    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
      <Icon size={24} className="text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm max-w-sm">{message}</p>
  </motion.div>
);

export default function Page() {
  return (
    <AuthProvider>
      <AuthComponent>
        <AuthenticatedPage />
      </AuthComponent>
    </AuthProvider>
  );
}

function AuthenticatedPage() {
  const { user } = useAuth();
  return (
    <>
      <AnimoChatProvider isGroupChat={true} user={user}>
        <ChatRooms />
      </AnimoChatProvider>
    </>
  );
}

function AuthComponent({ children }: { children: React.ReactNode }) {
  const { error, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <ServerCrash className="text-red-600" size={24} />
          </div>
          <h1 className="text-lg font-medium text-red-600 mb-2">Error</h1>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// --- MAIN COMPONENT ---
function ChatRooms() {
  const [chatServers, setChatServers] = useState<ChatServer[]>([]);
  const [allChatRooms, setAllChatRooms] = useState<ChatRoom[]>([]);
  const [filteredChatRooms, setFilteredChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState<string | null>(null);
  const { user, session } = useAuth();

  const fetchChatRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const serverResponse = await fetch(DISCOVERY_SERVICE_URL);
      if (!serverResponse.ok)
        throw new Error(
          `Discovery service failed (Status: ${serverResponse.status})`
        );

      const servers: ChatServer[] = await serverResponse.json();
      const runningServers = servers.filter((s) => s.status === "RUNNING");
      setChatServers(runningServers);

      if (runningServers.length === 0)
        throw new Error("No active chat servers found to host rooms.");

      const roomPromises = runningServers.map(async (server) => {
        try {
          const baseUrl = server.url.endsWith("/")
            ? server.url.slice(0, -1)
            : server.url;
          const roomsResponse = await fetch(`${baseUrl}/rooms`);
          if (!roomsResponse.ok) return [];
          const roomsData = await roomsResponse.json();
          return roomsData.map((room: Omit<ChatRoom, "serverUrl">) => ({
            ...room,
            serverUrl: server.url,
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(roomPromises);
      const allRooms = results.flat();
      setAllChatRooms(allRooms);
      setFilteredChatRooms(allRooms);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const filtered = allChatRooms.filter((room) =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChatRooms(filtered);
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery, allChatRooms]);

  const handleCreateRoom = async (name: string, maxParticipants: number) => {
    setIsCreatingRoom(true);
    setCreateRoomError(null);

    const server = chatServers[0];
    if (!server) {
      setCreateRoomError("No available chat server.");
      setIsCreatingRoom(false);
      return;
    }

    try {
      const baseUrl = server.url.endsWith("/")
        ? server.url.slice(0, -1)
        : server.url;
      const response = await fetch(`${baseUrl}/create-room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ name, maxParticipants }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create room.");
      }

      setIsModalOpen(false);
      await fetchChatRooms();
    } catch (e) {
      if (e instanceof Error) setCreateRoomError(e.message);
      else setCreateRoomError("An unexpected error occurred.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const renderRoomList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <LoadingSpinner />
            <span className="text-gray-600">Loading rooms...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <FeedbackState
          icon={ServerCrash}
          title="Could Not Load Rooms"
          message={error}
        />
      );
    }

    if (allChatRooms.length === 0) {
      return (
        <FeedbackState
          icon={WifiOff}
          title="No Rooms Available"
          message="There are currently no public chat rooms. Create one to get started!"
        />
      );
    }

    if (filteredChatRooms.length === 0 && searchQuery) {
      return (
        <FeedbackState
          icon={Search}
          title="No Rooms Found"
          message={`No rooms match "${searchQuery}". Try a different search term.`}
        />
      );
    }

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
      >
        {filteredChatRooms.map((room) => (
          <RoomListItem
            key={room.id}
            room={room}
            onJoin={() => setSelectedRoom(room)}
          />
        ))}
      </motion.div>
    );
  };

  if (selectedRoom) {
    return (
      <div className="h-[100dvh] overflow-clip">
        <ChatThemeProvider>
          <GroupChat
            room={selectedRoom}
            onLeave={() => setSelectedRoom(null)}
          />
        </ChatThemeProvider>
      </div>
    );
  }

  return (
    <>
      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRoom}
        isCreating={isCreatingRoom}
        error={createRoomError}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            {/* Left Side: Title and Room Count */}
            <div className="flex items-center gap-3">
              <Button
                variant={"ghost"}
                onClick={() => {
                  window?.history?.back();
                }}
              >
                <ArrowLeft />
              </Button>
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Chat Rooms</h1>
                <p className="text-sm text-gray-500">
                  {allChatRooms.length} rooms available
                </p>
              </div>
            </div>

            {/* Right Side: Search and Create Button */}
            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="relative flex-grow">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <Input
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10 w-full md:w-48 border-gray-300 focus:ring-green-500 focus:border-green-500 rounded-lg"
                />
              </div>

              {/* Create New Room Button */}
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white h-10 w-10 md:w-auto md:px-4 flex-shrink-0"
              >
                <PlusCircle size={20} className="md:mr-2" />
                <span className="hidden md:inline">New Room</span>
              </Button>
            </div>
          </div>

          {/* Room List */}
          <AnimatePresence mode="wait">{renderRoomList()}</AnimatePresence>
        </div>
      </div>
    </>
  );
}
