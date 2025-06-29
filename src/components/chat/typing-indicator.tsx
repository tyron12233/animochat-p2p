"use client";

import { ChatThemeV2 } from "@/src/lib/chat-theme";
import { AnimatePresence, motion } from "framer-motion";

interface TypingIndicatorProps {
  typingUsers: string[];
  theme: ChatThemeV2;
  mode: "light" | "dark";
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  theme,
  mode,
}) => {
  // If no one is typing, the component shouldn't render anything.
  if (typingUsers.length === 0) {
    return null;
  }

  // --- UI Styling ---
  // The typing indicator bubble should look like a message from the other user.
  const bubbleStyle = {
    backgroundColor: theme.message.strangerMessage.background[mode],
  };

  // The dots inside the indicator use a specific theme color.
  const dotStyle = {
    backgroundColor: theme.animations.typingIndicatorDots[mode],
  };

  const iconColor = theme.animations.typingIndicatorDots[mode];

  return (
    <motion.div
      key="typing-motiondiv"
      className="flex justify-start"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="flex items-center mb-2 mx-4 max-w-[100%] rounded-3xl px-4 py-3 relative"
        style={bubbleStyle}
      >
        <AnimatePresence>
          {typingUsers.length > 1 && (
          <div className="mx-2">{typingUsers.length}</div>
        )}
        </AnimatePresence>

        {/* This is the primary set of dots, always visible when someone is typing. */}
        <div className="flex my-2 mx-2">
          <div
            className="h-2 w-2 rounded-full animate-bounce [animation-delay:-0.3s]"
            style={dotStyle}
          ></div>
          <div
            className="h-2 w-2 mx-1 rounded-full animate-bounce [animation-delay:-0.15s]"
            style={dotStyle}
          ></div>
          <div
            className="h-2 w-2 rounded-full animate-bounce"
            style={dotStyle}
          ></div>
        </div>
      </div>
    </motion.div>
  );
};
