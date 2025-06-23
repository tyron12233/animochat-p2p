import { motion } from "motion/react";
import "./chat-message-item.css";

export const TypingIndicator: React.FC = () => {
  return (
    <motion.div key="typing-motiondiv" className="flex justify-start">
      <div className="flex mb-2 mx-4 max-w-[100%] rounded-3xl px-4 py-4 bg-gray-100 text-gray-800 relative">
        <div className="h-2 w-2 bg-gray-800 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 mx-1 bg-gray-800 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 bg-gray-800 rounded-full animate-bounce"></div>
      </div>
    </motion.div>
  );
};
