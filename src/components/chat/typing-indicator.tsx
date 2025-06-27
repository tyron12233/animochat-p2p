import { ChatThemeV2 } from "@/src/lib/chat-theme";
import { motion } from "framer-motion";


interface TypingIndicatorProps {
  theme: ChatThemeV2;
  mode: "light" | "dark";
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ theme, mode }) => {
  // The typing indicator bubble should look like a message from the other user.
  const bubbleStyle = {
    backgroundColor: theme.message.strangerMessage.background[mode],
  };

  // The dots inside the indicator use a specific theme color.
  const dotStyle = {
    backgroundColor: theme.animations.typingIndicatorDots[mode],
  };

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
        className="flex mb-2 mx-4 max-w-[100%] rounded-3xl px-4 py-4 relative"
        style={bubbleStyle}
      >
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
    </motion.div>
  );
};
