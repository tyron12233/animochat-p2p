"use client";

import BackgroundElements from "../components/ui/background-elements";
import { useEffect, useState } from "react";
import InterestSelector from "../components/interests-selector";
import Chat from "../components/chat";
import { useAnimochatV2 } from "../hooks/useAnimochat";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import { Server, Shield } from "lucide-react";
import useChatSession from "../hooks/use-chat-session";
import { useAuth } from "../context/auth-context";
import { useAnimoChat } from "../hooks/use-animochat";

export default function Home() {
  const { user, session, login, logout, isLoading: isAuthLoading } = useAuth();
  const { chatSessionData, chatSessionStatus } = useChatSession(user);

  const { session: sessionCtx, chat, matchmaking } = useAnimoChat();
  const { screen, status, setScreen } = sessionCtx;
  const {
    connectToChat,
    messages,
    participants,
    typingUsers,
    sendMessage,
    editMessage,
    onDeleteMessage,
    onReact,
    onChangeTheme,
    onStartTyping,
    disconnect,
  } = chat;
  const { startMatchmaking, onCancelMatchmaking } = matchmaking;

  const [isLoginDialogOpen, setLoginDialogOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [interests, setInterests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (chatSessionStatus === "existing_session" && chatSessionData) {
      connectToChat(chatSessionData.chatServerUrl, chatSessionData.chatId);
      setScreen("chat");
    }
  }, [chatSessionStatus, chatSessionData, connectToChat, setScreen]);

  const handleFindMatch = (interestsToMatch: Set<string>) => {
    startMatchmaking(Array.from(interestsToMatch));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(adminUsername, adminPassword);
    setLoginDialogOpen(false);
    setAdminUsername("");
    setAdminPassword("");
  };

  function handleGetStarted() {
    setScreen("matchmaking");
  }

  // Animation properties for page transitions
  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.23, ease: "easeInOut" },
  } as Variants;

  const renderScreen = () => {
    switch (screen) {
      case "chat":
        return (
          <motion.div
            key="chat"
            {...pageTransition}
            className="h-full w-full flex items-center justify-center sm:p-4"
          >
            <Chat
              groupChat={false}
              name=""
              onBack={() => {
                setScreen("matchmaking");
              }}
              newChat={() => {
                handleFindMatch(interests);
              }}
            />
          </motion.div>
        );

      case "matchmaking":
        return (
          <motion.div
            key="matchmaking"
            {...pageTransition}
            className="w-full h-full flex flex-col justify-center items-center"
          >
            <div className="max-w-3xl mx-auto relative w-full">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  Choose Your Interests
                </h2>
                <p className="text-gray-600 text-lg my-8">
                  Find someone to chat with based on what you like.
                </p>
              </div>
            </div>
            <InterestSelector
              interests={interests}
              onInterestsChange={setInterests}
              onFindMatch={handleFindMatch}
              isConnecting={
                status === "finding_match" ||
                status === "connecting" ||
                isAuthLoading
              }
              status={status}
            />
          </motion.div>
        );

      case "intro":
      default:
        return (
          <motion.div
            key="intro"
            {...pageTransition}
            className="w-full h-full flex flex-col justify-center items-center"
          >
            <div className="max-w-3xl mx-auto relative w-full">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  Real-time
                  <br />
                  Anonymous Chat
                </h2>
                <p className="text-gray-600 text-lg my-8">
                  Connect with students anonymously and securely.
                </p>
              </div>
            </div>

            <div className="max-w-md mx-auto text-sm space-y-6 text-center">
              <div className="text-yellow-700 bg-yellow-50 p-4 rounded-2xl border border-yellow-200 font-medium">
                <p>
                  <strong>Notice:</strong> This site will soon move to a new
                  domain:{" "}
                  <a
                    href="https://chat.tyronscott.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-green-700 font-semibold"
                  >
                    chat.tyronscott.me
                  </a>
                  . Please update your bookmarks!
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="rounded-full py-7 px-8 bg-green-600 hover:bg-green-700 text-white font-bold text-lg"
              >
                Get Started
              </Button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden relative">
      <main
        className={`container h-full mx-auto flex flex-col ${
          screen === "chat" ? "p-0" : "px-4 py-8 md:py-16"
        }`}
      >
        {screen !== "chat" && <BackgroundElements />}

        <div className="flex-grow flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">{renderScreen()}</AnimatePresence>
        </div>

        {screen !== "chat" && (
          <footer className="text-xs text-gray-500 text-center py-4 shrink-0">
            <h3 className="py-4">
              Created by developers from{" "}
              <span className="text-green-700 font-semibold">
                De La Salle Lipa
              </span>
            </h3>
            {user?.id && (
              <p className="font-mono text-gray-400 text-[10px] mt-2">
                Your User ID: {user.id}
              </p>
            )}

            {user?.role && (
              <p className="font-mono text-gray-400 text-[10px] mt-2">
                Your Role:{" "}
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            )}

            {/* log out button */}
            {user?.role === "admin" && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  className="text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  onClick={() => logout()}
                >
                  Log Out
                </Button>
              </div>
            )}

            <div className="mt-4">
              <Link href="/status" passHref>
                <Button
                  variant="ghost"
                  className="text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Server className="h-4 w-4 mr-2" />
                  Service Status
                </Button>
              </Link>
            </div>
          </footer>
        )}
      </main>

      {/* Hidden Admin Login Button */}
      {screen !== "chat" && (
        <div
          className="absolute bottom-2 right-2 h-6 w-6 cursor-pointer"
          onClick={() => setLoginDialogOpen(true)}
          title="Admin Login"
        />
      )}

      {/* Admin Login Dialog */}
      <AnimatePresence>
        {isLoginDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setLoginDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()} // Prevents dialog from closing when clicking inside
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 p-3 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-green-700" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Administrator Access
                </h2>
                <p className="text-gray-500 mb-6">
                  Please enter your credentials to continue.
                </p>
              </div>
              <form onSubmit={handleAdminLogin}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="admin-username"
                      className="text-sm font-medium text-gray-700"
                    >
                      Username
                    </label>
                    <input
                      id="admin-username"
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <input
                      id="admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setLoginDialogOpen(false)}
                    className="px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2"
                  >
                    Login
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
