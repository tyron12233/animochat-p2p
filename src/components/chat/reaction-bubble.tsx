import { ChatThemeV2 } from "@/src/lib/chat-theme";
import { Message, Reaction, User } from "@/src/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

interface ReactionBubbleProps {
  message: any;
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
  const [showDialog, setShowDialog] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reactions = message.reactions as Reaction[] | undefined;

    // Close dialog when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setShowDialog(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

     if (!reactions || reactions.length === 0) return null;
 

  const reactionCount = reactions?.length || 0;
  const reactionEmojis: string[] = Array.from(
    new Set(reactions?.map((reaction: any) => reaction.emoji) || [])
  );

  const userReaction = reactions.find(
    (reaction: any) => reaction.user_id === user.id
  );
  
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc: Record<string, any[]>, reaction: any) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {});



  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex justify-end px-2 relative"
      >
        <div
          className="self-end text-xs relative rounded-full mt-auto border-2 p-1.5 -top-2 cursor-pointer"
          style={{
            backgroundColor: theme.reactions.bubble.background[mode],
            borderColor: theme.reactions.bubble.border[mode],
            color: theme.reactions.bubble.text[mode],
          }}
          onClick={() => setShowDialog(!showDialog)}
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
        
        <AnimatePresence>
          {showDialog && (
            <motion.div 
              ref={dialogRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute bottom-8 ${message.sender !== user.id ? 'left-2' : 'right-2'} z-10 p-2 rounded-lg shadow-lg w-48`}
              style={{
                backgroundColor: theme.reactions.bubble.background[mode],
                borderColor: theme.reactions.bubble.border[mode],
                color: theme.reactions.bubble.text[mode],
                border: `1px solid ${theme.reactions.bubble.border[mode]}`
              }}
            >
              <div className="text-xs font-medium mb-1">Reactions</div>
              {Object.entries(groupedReactions).map(([emoji, users] : any) => (
                <div key={emoji} className="mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span>{emoji}</span>
                    <span className="text-xs">({users.length})</span>
                  </div>
                  <div className="pl-2">
                    {users.map((reaction: Reaction, index: number) => (
                      <div key={index} className="text-xs truncate">
                        {reaction.nickname || "Anonymous"}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
