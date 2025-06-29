"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatThemeV2 } from "../lib/chat-theme";
import { Message, User } from "../lib/types";
import { AnimateChangeInHeight } from "../lib/animate-height-change";
import ChatMessageItem from "./chat/chat-message-item";
import { Circle, CircleIcon } from "lucide-react";

interface ThemePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  themes: ChatThemeV2[];
  activeTheme: ChatThemeV2;
  setActiveThemeAndMode: (theme: ChatThemeV2, mode: "light" | "dark") => void;
  activeMode: "light" | "dark";
}

const ThemePreview = ({
  theme,
  mode,
}: {
  theme: ChatThemeV2;
  mode: "light" | "dark";
}) => {
  const isEmojiMenuOpen = useRef(false);
  const user: User = {
    id: "me",
  };
  const previewMessages: Message[] = [
    {
      id: "1",
      content: "Preview message!",
      sender: "stranger",
      created_at: new Date().toISOString(),
      session_id: "1",
      hasNext: true,
    } as Message,

    {
      id: "3",
      content: "I can't think of anything to put here",
      sender: "stranger",
      created_at: new Date().toISOString(),
      session_id: "1",
      hasPrevious: true,
    } as Message,

    {
      id: "2",
      content: "This looks great.",
      sender: "me",
      created_at: new Date().toISOString(),
      session_id: "1",
      hasNext: true,
    },
    {
      id: "8",
      content: "LOL! just type anything",
      sender: "me",
      created_at: new Date().toISOString(),
      session_id: "1",
      hasPrevious: true,
      reactions: [{ emoji: "😆", user_id: "1", message_id: "8" }],
    } as any,
  ];

  const renderMessage = (msg: Message, index: number) => {
    const isSystem = msg.sender === "system" || msg.type === "system";

    if (isSystem) {
      return (
        <div key={index} className="text-center my-2 mx-4">
          <span
            style={{
              color: theme.message.systemMessage.text[mode],
              backgroundColor: theme.message.systemMessage.background[mode],
            }}
            className="
        box-decoration-clone 
        text-xs
        rounded-full
        px-3
        py-1
        leading-relaxed      
      "
          >
            {msg.content}
          </span>
        </div>
      );
    }

    return (
      <AnimateChangeInHeight key={msg.id + "listener"}>
        <ChatMessageItem
          participants={[]}
          key={index}
          index={index}
          message={msg}
          user={user}
          isLast={index === 0}
          onSwipe={() => {}}
          onStartedSwipe={() => {}}
          onEndedSwipe={() => {}}
          onReact={async () => {}}
          onOpenEmojiMenu={() => {}}
          onResendMessage={() => {}}
          isEmojiMenuOpen={isEmojiMenuOpen}
          theme={theme}
          mode={mode}
          animate={true}
          secondVisibleElement={null}
        />
      </AnimateChangeInHeight>
    );
  };

  return (
    <div
      className="w-full p-4 rounded-lg flex flex-col"
      style={{ background: theme.general.background[mode] }}
    >
      <div className="flex flex-col">
        {previewMessages.map((msg, index) => (
          <div key={msg.id} className="w-full">
            {renderMessage(msg, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ThemePickerDialog({
  isOpen,
  onClose,
  themes,
  activeTheme,
  setActiveThemeAndMode,
  activeMode,
}: ThemePickerDialogProps) {
  const [previewTheme, setPreviewTheme] = useState(activeTheme);
  const [previewMode, setPreviewMode] = useState(activeMode);

  useEffect(() => {
    setPreviewTheme(activeTheme);
    setPreviewMode(activeMode);
  }, [isOpen, activeTheme, activeMode]);

  const handleSave = () => {
    setActiveThemeAndMode(previewTheme, previewMode);
    onClose();
  };

  const handleCancel = () => {
    // Reset preview state on cancel before closing
    setPreviewTheme(activeTheme);
    setPreviewMode(activeMode);
    onClose();
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = themes.find((t) => t.name === event.target.value);
    if (selectedTheme) {
      setPreviewTheme(selectedTheme);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-12 overflow-y-auto"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Choose Theme
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-5">
              {/* Left Side: Controls */}
              <div className="flex flex-col space-y-6">
                <div className="relative">
                  <select
                    value={previewTheme.name}
                    onChange={handleThemeChange}
                    style={{
                      backgroundColor: previewTheme.accent.faded[previewMode]
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border appearance-none transition-colors duration-300 focus:outline-none focus:ring-2"
                  >
                    {themes.map((theme) => (
                      <option key={theme.name} value={theme.name}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2"
                    style={{ color: previewTheme.secondaryText[previewMode] }}
                  >
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                    Mode
                  </h3>
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewMode("light")}
                      className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-colors ${
                        previewMode === "light"
                          ? "bg-white dark:bg-gray-500 text-gray-800 dark:text-white shadow"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setPreviewMode("dark")}
                      className={`w-1/2 py-2 rounded-md text-sm font-semibold transition-colors ${
                        previewMode === "dark"
                          ? "bg-black text-white shadow"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      Dark
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side: Preview */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                  Preview
                </h3>
                <div className="bg-gray-200 dark:bg-gray-900 rounded-xl overflow-hidden shadow-inner">
                  <ThemePreview theme={previewTheme} mode={previewMode} />
                </div>
              </div>
            </div>

            <div className="p-5 border-t dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
