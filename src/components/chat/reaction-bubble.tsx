import { ChatThemeV2 } from "@/src/lib/chat-theme";
import {  Message, User } from "@/src/lib/types"; // Assuming types are in this path
import { motion } from "framer-motion";

/*
This component expects a `theme` prop that matches the `ChatThemeV2` interface, 
which is aligned with the main chat component's theme structure. It also requires a `mode` prop ('light' | 'dark').

This migration assumes a new key for styling the reaction bubble.

Example structure for `ChatThemeV2` additions used here:

interface ColorScheme {
  light: string;
  dark: string;
}

interface ChatThemeV2 {
  // ... other properties from main theme
  reactions: {
    bubble: {
      background: ColorScheme;
      border: ColorScheme;
      text: ColorScheme;
    }
  }
}
*/

/* ReactionBubble Component */
interface ReactionBubbleProps {
  message: any; // Consider creating a more specific type
  user: User;
  theme: ChatThemeV2;
  mode: "light" | "dark";
}

export default function ReactionBubble({
  message,
  user,
  theme,
  mode,
}: ReactionBubbleProps) {
  const reactions = message.reactions;
  if (!reactions || reactions.length === 0) return null;

  const reactionCount = reactions.length;
  const reactionEmojis: string[] = Array.from(
    new Set(reactions.map((reaction: any) => reaction.emoji))
  );
  
  // This part of the logic was in the original code, but not used.
  // Leaving it here in case it's needed for future features.
  const userReaction = reactions.find(
    (reaction: any) => reaction.user_id === user.id
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex justify-end px-2"
    >
      <div
        className="self-end text-xs relative rounded-full mt-auto border-2 p-1.5 -top-2"
        style={{
          backgroundColor: theme.reactions.bubble.background[mode],
          borderColor: theme.reactions.bubble.border[mode],
          color: theme.reactions.bubble.text[mode],
        }}
      >
        <div className="flex justify-center items-center">
          {reactionEmojis.map((emoji: string, index: number) => (
            <div key={index} className="text-center">
              {emoji}
            </div>
          ))}
          {reactionCount > 0 && (
            <p className="pl-1">
              <span>{reactionCount}</span>
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
