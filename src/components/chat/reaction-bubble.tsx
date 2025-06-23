
import { ChatTheme, User } from "@/src/lib/types";
import { motion } from "motion/react";


/* ReactionBubble Component */
interface ReactionBubbleProps {
  message: any;
  user: User;
  theme: ChatTheme;
}

export default function ReactionBubble({ message, user, theme }: ReactionBubbleProps) {
  const reactions = message.reactions;
  if (!reactions || reactions.length === 0) return null;
  const reactionCount = reactions.length;
  const reactionEmojis: any[] = Array.from(
    new Set(reactions.map((reaction: any) => reaction.emoji))
  );
  const userReaction = reactions.find(
    (reaction: any) => reaction.user_id === user.id
  );
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex justify-end"
    >
      <div className="self-end text-xs text-black relative rounded-full mt-auto bg-gray-200 border-2 border-white p-1.5 -top-2">
        <div className="flex justify-center">
          {reactionEmojis.map((emoji: string, index: number) => (
            <div key={index} className="text-center">
              {emoji}
            </div>
          ))}
          <p className="pl-1">
            <span
              style={{
                // if user reacted use themeAccentColor
                color: userReaction ? theme.accentColor : "black",
              }}
            >
              {reactionCount}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}